package com.kairos.erp.kci.app;

import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.kci.app.ProblemasCronicosService.Cronico;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Relatório inteligente da IA preditiva (Conlor): consolida o histórico de
 * manutenções para apontar drones com mais problemas, peças mais trocadas,
 * falhas recorrentes, causas prováveis e recomendações. Exporta em PDF, CSV e
 * Excel. Motor determinístico e offline.
 */
@Service
public class RelatorioIaService {

    private final ProblemasCronicosService cronicosService;
    private final SugestaoService sugestaoService;
    private final EstoqueService estoque;

    public RelatorioIaService(ProblemasCronicosService cronicosService, SugestaoService sugestaoService,
                              EstoqueService estoque) {
        this.cronicosService = cronicosService;
        this.sugestaoService = sugestaoService;
        this.estoque = estoque;
    }

    public record PecaTroca(String sku, String descricao, BigDecimal quantidade) {
    }

    public record RelatorioIa(String geradoEm,
                              long osConcluidas,
                              List<Cronico> dronesComMaisProblemas,
                              List<PecaTroca> pecasMaisTrocadas,
                              List<String> falhasRecorrentes,
                              List<String> recomendacoes) {
    }

    @Transactional(readOnly = true)
    public RelatorioIa montar() {
        List<Cronico> cronicos = cronicosService.cronicos();
        long osConcluidas = cronicos.stream().mapToLong(Cronico::manutencoes).sum();

        // Peças mais trocadas (consumo agregado por SKU)
        Map<String, BigDecimal> consumo = estoque.consumoPorItem();
        List<PecaTroca> pecas = new ArrayList<>();
        for (ItemEstoque i : estoque.listar()) {
            BigDecimal q = consumo.getOrDefault(i.getId(), BigDecimal.ZERO);
            if (q.signum() > 0) {
                pecas.add(new PecaTroca(i.getSku(), i.getDescricao(), q));
            }
        }
        pecas.sort(Comparator.comparing(PecaTroca::quantidade).reversed());
        if (pecas.size() > 10) {
            pecas = pecas.subList(0, 10);
        }

        // Falhas recorrentes (peça crônica por modelo)
        List<String> falhas = new ArrayList<>();
        for (Cronico c : cronicos) {
            if (c.pecaMaisRecorrente() != null) {
                falhas.add(c.modelo() + ": " + c.pecaMaisRecorrente()
                        + " (" + c.quantidadePeca().stripTrailingZeros().toPlainString() + "x em "
                        + c.manutencoes() + " manutenções)");
            }
        }

        // Recomendações: correlação das peças mais trocadas + gestão de estoque
        List<String> recomendacoes = new ArrayList<>();
        List<String> nomesPecas = pecas.stream().map(p -> p.sku() + " " + p.descricao()).toList();
        sugestaoService.analisar(nomesPecas).forEach(s ->
                recomendacoes.add("Padrão " + s.padrao() + ": " + s.alerta()));
        if (!pecas.isEmpty()) {
            recomendacoes.add("Mantenha estoque de segurança de " + pecas.get(0).sku()
                    + " — é a peça mais trocada da operação.");
        }
        for (Cronico c : cronicos) {
            if (c.manutencoes() >= 3 && c.pecaMaisRecorrente() != null) {
                recomendacoes.add("Modelo " + c.modelo() + " apresenta falha crônica em "
                        + c.pecaMaisRecorrente() + " — inclua verificação preventiva no checklist.");
            }
        }
        if (recomendacoes.isEmpty()) {
            recomendacoes.add("Sem padrões relevantes ainda — o relatório fica mais rico conforme o "
                    + "histórico de manutenções cresce.");
        }

        String geradoEm = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        return new RelatorioIa(geradoEm, osConcluidas, cronicos, pecas, falhas, recomendacoes);
    }

    // --- Exportações --------------------------------------------------------

    @Transactional(readOnly = true)
    public byte[] gerarPdf() {
        RelatorioIa r = montar();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(30, 58, 138));
        Font h2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(37, 99, 235));
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font cab = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);

        doc.add(new Paragraph("Conlor Drones — Relatório de IA Preditiva", titulo));
        doc.add(new Paragraph("Gerado em " + r.geradoEm() + "  ·  " + r.osConcluidas()
                + " manutenções analisadas", normal));
        doc.add(Chunk.NEWLINE);

        doc.add(new Paragraph("Drones com mais problemas (por modelo)", h2));
        PdfPTable t1 = new PdfPTable(new float[]{40, 20, 30, 10});
        t1.setWidthPercentage(100);
        for (String c : new String[]{"Modelo", "Manutenções", "Peça recorrente", "Qtd"}) {
            PdfPCell cell = new PdfPCell(new Phrase(c, cab));
            cell.setBackgroundColor(new Color(241, 245, 249));
            cell.setPadding(5);
            t1.addCell(cell);
        }
        for (Cronico c : r.dronesComMaisProblemas()) {
            t1.addCell(cel(c.modelo(), normal));
            t1.addCell(cel(String.valueOf(c.manutencoes()), normal));
            t1.addCell(cel(c.pecaMaisRecorrente() == null ? "—" : c.pecaMaisRecorrente(), normal));
            t1.addCell(cel(c.quantidadePeca().stripTrailingZeros().toPlainString(), normal));
        }
        doc.add(t1);
        doc.add(Chunk.NEWLINE);

        doc.add(new Paragraph("Peças mais trocadas", h2));
        PdfPTable t2 = new PdfPTable(new float[]{25, 55, 20});
        t2.setWidthPercentage(100);
        for (String c : new String[]{"SKU", "Descrição", "Quantidade"}) {
            PdfPCell cell = new PdfPCell(new Phrase(c, cab));
            cell.setBackgroundColor(new Color(241, 245, 249));
            cell.setPadding(5);
            t2.addCell(cell);
        }
        for (PecaTroca p : r.pecasMaisTrocadas()) {
            t2.addCell(cel(p.sku(), normal));
            t2.addCell(cel(p.descricao(), normal));
            t2.addCell(cel(p.quantidade().stripTrailingZeros().toPlainString(), normal));
        }
        doc.add(t2);
        doc.add(Chunk.NEWLINE);

        doc.add(new Paragraph("Falhas recorrentes", h2));
        for (String f : r.falhasRecorrentes()) {
            doc.add(new Paragraph("• " + f, normal));
        }
        if (r.falhasRecorrentes().isEmpty()) {
            doc.add(new Paragraph("Nenhuma falha recorrente identificada.", normal));
        }
        doc.add(Chunk.NEWLINE);

        doc.add(new Paragraph("Recomendações", h2));
        for (String rec : r.recomendacoes()) {
            doc.add(new Paragraph("• " + rec, normal));
        }

        doc.close();
        return out.toByteArray();
    }

    private static PdfPCell cel(String texto, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(texto, f));
        c.setPadding(4);
        return c;
    }

    @Transactional(readOnly = true)
    public String gerarCsv() {
        RelatorioIa r = montar();
        StringBuilder sb = new StringBuilder();
        sb.append("Categoria;Chave;Valor;Detalhe\n");
        sb.append("Resumo;Manutenções analisadas;").append(r.osConcluidas()).append(";\n");
        for (Cronico c : r.dronesComMaisProblemas()) {
            sb.append("Drones com mais problemas;").append(csv(c.modelo())).append(';')
                    .append(c.manutencoes()).append(';')
                    .append(csv((c.pecaMaisRecorrente() == null ? "" : c.pecaMaisRecorrente())
                            + " x" + c.quantidadePeca().stripTrailingZeros().toPlainString())).append('\n');
        }
        for (PecaTroca p : r.pecasMaisTrocadas()) {
            sb.append("Peças mais trocadas;").append(csv(p.sku())).append(';')
                    .append(p.quantidade().stripTrailingZeros().toPlainString()).append(';')
                    .append(csv(p.descricao())).append('\n');
        }
        for (String f : r.falhasRecorrentes()) {
            sb.append("Falhas recorrentes;;;").append(csv(f)).append('\n');
        }
        for (String rec : r.recomendacoes()) {
            sb.append("Recomendações;;;").append(csv(rec)).append('\n');
        }
        return sb.toString();
    }

    /** Excel via tabela HTML (aberta nativamente pelo Excel). */
    @Transactional(readOnly = true)
    public String gerarExcelHtml() {
        RelatorioIa r = montar();
        StringBuilder sb = new StringBuilder();
        sb.append("<html><head><meta charset=\"UTF-8\"></head><body>");
        sb.append("<h2>Relatório de IA Preditiva — Conlor Drones</h2>");
        sb.append("<p>Gerado em ").append(r.geradoEm()).append(" · ").append(r.osConcluidas())
                .append(" manutenções analisadas</p>");
        sb.append("<h3>Drones com mais problemas</h3><table border=1><tr>"
                + "<th>Modelo</th><th>Manutenções</th><th>Peça recorrente</th><th>Qtd</th></tr>");
        for (Cronico c : r.dronesComMaisProblemas()) {
            sb.append("<tr><td>").append(html(c.modelo())).append("</td><td>").append(c.manutencoes())
                    .append("</td><td>").append(html(c.pecaMaisRecorrente() == null ? "" : c.pecaMaisRecorrente()))
                    .append("</td><td>").append(c.quantidadePeca().stripTrailingZeros().toPlainString())
                    .append("</td></tr>");
        }
        sb.append("</table><h3>Peças mais trocadas</h3><table border=1>"
                + "<tr><th>SKU</th><th>Descrição</th><th>Quantidade</th></tr>");
        for (PecaTroca p : r.pecasMaisTrocadas()) {
            sb.append("<tr><td>").append(html(p.sku())).append("</td><td>").append(html(p.descricao()))
                    .append("</td><td>").append(p.quantidade().stripTrailingZeros().toPlainString())
                    .append("</td></tr>");
        }
        sb.append("</table><h3>Recomendações</h3><ul>");
        for (String rec : r.recomendacoes()) {
            sb.append("<li>").append(html(rec)).append("</li>");
        }
        sb.append("</ul></body></html>");
        return sb.toString();
    }

    private static String csv(String s) {
        if (s == null) {
            return "";
        }
        return s.contains(";") || s.contains("\"") ? "\"" + s.replace("\"", "\"\"") + "\"" : s;
    }

    private static String html(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
