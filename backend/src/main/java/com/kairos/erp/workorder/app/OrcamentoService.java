package com.kairos.erp.workorder.app;

import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.workorder.domain.OrdemServico;
import com.kairos.erp.workorder.domain.OrdemServicoItem;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Orçamento automatizado da Conlor Drones: consolida as peças da OS (com o
 * preço congelado do estoque), separa o escopo inicial dos adicionais
 * (destacados) e gera o PDF automático + a mensagem de WhatsApp.
 */
@Service
public class OrcamentoService {

    private final OrdemServicoService ordens;
    private final EstoqueService estoque;
    private final EquipamentoService equipamentos;

    public OrcamentoService(OrdemServicoService ordens, EstoqueService estoque,
                            EquipamentoService equipamentos) {
        this.ordens = ordens;
        this.estoque = estoque;
        this.equipamentos = equipamentos;
    }

    public record Linha(String id, String itemId, String sku, String descricao, BigDecimal quantidade,
                        BigDecimal precoUnitario, BigDecimal subtotal,
                        int estagio, boolean adicional, boolean baixado) {
    }

    public record Orcamento(String ordemServicoId, String numero, String status,
                            String serialNumber, String modelo, String diagnostico,
                            List<Linha> linhas,
                            BigDecimal totalInicial, BigDecimal totalAdicionais,
                            BigDecimal maoDeObra, BigDecimal total) {
    }

    @Transactional(readOnly = true)
    public Orcamento montar(String ordemServicoId) {
        OrdemServico os = ordens.buscar(ordemServicoId);
        Equipamento eq = equipamentos.buscar(os.getEquipamentoId());
        List<Linha> linhas = new ArrayList<>();
        BigDecimal totalInicial = BigDecimal.ZERO;
        BigDecimal totalAdicionais = BigDecimal.ZERO;
        for (OrdemServicoItem it : ordens.itensDa(ordemServicoId)) {
            ItemEstoque item = estoque.buscar(it.getItemId());
            BigDecimal subtotal = it.subtotal();
            linhas.add(new Linha(it.getId(), it.getItemId(), item.getSku(), item.getDescricao(),
                    it.getQuantidade(), it.getPrecoUnitario(), subtotal, it.getEstagio(),
                    it.ehAdicional(), it.isBaixado()));
            if (it.ehAdicional()) {
                totalAdicionais = totalAdicionais.add(subtotal);
            } else {
                totalInicial = totalInicial.add(subtotal);
            }
        }
        BigDecimal maoDeObra = os.getMaoDeObra();
        BigDecimal total = totalInicial.add(totalAdicionais).add(maoDeObra);
        return new Orcamento(os.getId(), os.getNumero(), os.getStatus(),
                eq.getSerialNumber(), eq.getModelo(), os.getDiagnostico(), linhas,
                totalInicial, totalAdicionais, maoDeObra, total);
    }

    /** PDF automático do orçamento (adicionais destacados). */
    @Transactional(readOnly = true)
    public byte[] gerarPdf(String ordemServicoId) {
        Orcamento orc = montar(ordemServicoId);

        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(30, 58, 138));
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font negrito = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font destaque = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(180, 83, 9));

        doc.add(new Paragraph("Conlor Drones — Orçamento de Manutenção", titulo));
        doc.add(new Paragraph("OS " + orc.numero() + "  ·  Aeronave " + orc.modelo()
                + "  ·  S/N " + orc.serialNumber(), normal));
        doc.add(Chunk.NEWLINE);

        PdfPTable tabela = new PdfPTable(new float[]{22, 38, 10, 15, 15});
        tabela.setWidthPercentage(100);
        for (String cab : new String[]{"Peça", "Descrição", "Qtd", "Unitário (R$)", "Subtotal (R$)"}) {
            PdfPCell c = new PdfPCell(new Phrase(cab, negrito));
            c.setBackgroundColor(new Color(241, 245, 249));
            c.setPadding(6);
            tabela.addCell(c);
        }
        for (Linha l : orc.linhas()) {
            Font f = l.adicional() ? destaque : normal;
            String sku = l.adicional() ? l.sku() + " (ADICIONAL)" : l.sku();
            Color fundo = l.adicional() ? new Color(255, 251, 235) : Color.WHITE;
            for (String valor : new String[]{sku, l.descricao(), l.quantidade().stripTrailingZeros().toPlainString(),
                    l.precoUnitario().toPlainString(), l.subtotal().toPlainString()}) {
                PdfPCell c = new PdfPCell(new Phrase(valor, f));
                c.setBackgroundColor(fundo);
                c.setPadding(5);
                tabela.addCell(c);
            }
        }
        doc.add(tabela);
        doc.add(Chunk.NEWLINE);

        Paragraph totais = new Paragraph();
        totais.setAlignment(Element.ALIGN_RIGHT);
        totais.add(new Phrase("Escopo inicial (peças): R$ " + orc.totalInicial().toPlainString() + "\n", normal));
        if (orc.totalAdicionais().signum() > 0) {
            totais.add(new Phrase("Adicionais (pós-diagnóstico): R$ "
                    + orc.totalAdicionais().toPlainString() + "\n", destaque));
        }
        if (orc.maoDeObra().signum() > 0) {
            totais.add(new Phrase("Mão de obra: R$ " + orc.maoDeObra().toPlainString() + "\n", normal));
        }
        totais.add(new Phrase("TOTAL: R$ " + orc.total().toPlainString(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13)));
        doc.add(totais);

        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Aprove pelo aplicativo ou responda esta mensagem. "
                + "Peças adicionais são identificadas após a montagem (Estágio 1).", normal));

        doc.close();
        return out.toByteArray();
    }

    /**
     * Link de WhatsApp (wa.me) com a mensagem do orçamento pronta para envio.
     * Com telefone, abre direto a conversa do cliente.
     */
    @Transactional(readOnly = true)
    public String linkWhatsApp(String ordemServicoId, String telefone) {
        Orcamento orc = montar(ordemServicoId);
        StringBuilder msg = new StringBuilder();
        msg.append("Olá! Orçamento da sua manutenção Conlor Drones — OS ").append(orc.numero())
                .append(" (").append(orc.modelo()).append(", S/N ").append(orc.serialNumber()).append(")\n\n");
        for (Linha l : orc.linhas()) {
            msg.append(l.adicional() ? "▲ " : "• ").append(l.sku()).append(" x")
                    .append(l.quantidade().stripTrailingZeros().toPlainString())
                    .append(" — R$ ").append(l.subtotal().toPlainString()).append("\n");
        }
        if (orc.totalAdicionais().signum() > 0) {
            msg.append("\n▲ itens adicionais identificados no diagnóstico\n");
        }
        msg.append("\nTOTAL: R$ ").append(orc.total().toPlainString())
                .append("\n\nResponda APROVO para autorizarmos o serviço, ou aprove pelo aplicativo.");

        String texto = URLEncoder.encode(msg.toString(), StandardCharsets.UTF_8);
        String numero = telefone == null ? "" : telefone.replaceAll("\\D", "");
        return numero.isEmpty()
                ? "https://wa.me/?text=" + texto
                : "https://wa.me/" + numero + "?text=" + texto;
    }
}
