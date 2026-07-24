package com.kairos.erp.dev;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.shared.security.UsuarioAtual;
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
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Console do Desenvolvedor. Reúne as solicitações de alteração (tela, campo, o
 * que mudar) e, ao salvar, gera um PDF para download — que documenta exatamente
 * o que deve ser editado no sistema. Privativo do perfil DEV.
 */
@RestController
@RequestMapping("/api/v1/dev")
public class DesenvolvedorController {

    private final AuditoriaService auditoria;

    public DesenvolvedorController(AuditoriaService auditoria) {
        this.auditoria = auditoria;
    }

    public record ItemAlteracao(String tela, String campo, String alteracao) {
    }

    public record SolicitacaoRequest(String titulo, @NotEmpty List<ItemAlteracao> itens) {
    }

    @PostMapping(value = "/solicitacoes.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasRole('DEV')")
    public ResponseEntity<byte[]> gerar(@Valid @RequestBody SolicitacaoRequest req) {
        String titulo = (req.titulo() == null || req.titulo().isBlank())
                ? "Solicitação de alterações" : req.titulo();
        byte[] pdf = pdf(titulo, req.itens());
        auditoria.registrar("DEV_SOLICITACAO", "desenvolvedor", null,
                titulo + " (" + req.itens().size() + " item(ns))");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=solicitacao-alteracoes.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private byte[] pdf(String titulo, List<ItemAlteracao> itens) {
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font tFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, new Color(30, 58, 138));
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font cab = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

        doc.add(new Paragraph("Conlor Drones — " + titulo, tFont));
        String autor = UsuarioAtual.nome() == null ? "Desenvolvedor" : UsuarioAtual.nome();
        doc.add(new Paragraph("Solicitado por " + autor + " em "
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), normal));
        doc.add(Chunk.NEWLINE);

        PdfPTable t = new PdfPTable(new float[]{6, 22, 22, 50});
        t.setWidthPercentage(100);
        for (String h : new String[]{"#", "Tela / Área", "Campo / Item", "Alteração solicitada"}) {
            PdfPCell c = new PdfPCell(new Phrase(h, cab));
            c.setBackgroundColor(new Color(241, 245, 249));
            c.setPadding(5);
            t.addCell(c);
        }
        int n = 1;
        for (ItemAlteracao it : itens) {
            t.addCell(cel(String.valueOf(n++), normal));
            t.addCell(cel(nvl(it.tela()), normal));
            t.addCell(cel(nvl(it.campo()), normal));
            t.addCell(cel(nvl(it.alteracao()), normal));
        }
        doc.add(t);
        doc.close();
        return out.toByteArray();
    }

    private static PdfPCell cel(String texto, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(texto, f));
        c.setPadding(4);
        return c;
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }
}
