package com.kairos.erp.audit.app;

import com.kairos.erp.audit.domain.EventoAuditoria;
import com.kairos.erp.shared.config.BrandProperties;
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

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Gera o relatório PDF da trilha de auditoria por período (KCD). */
@Service
public class AuditoriaPdfService {

    private static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final BrandProperties marca;

    public AuditoriaPdfService(BrandProperties marca) {
        this.marca = marca;
    }

    public byte[] gerar(List<EventoAuditoria> eventos, LocalDate inicio, LocalDate fim) {
        Document doc = new Document(PageSize.A4.rotate(), 30, 30, 30, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, marca.corAwt());
        Font sub = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font inst = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
        Font cab = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font cel = FontFactory.getFont(FontFactory.HELVETICA, 8);

        doc.add(new Paragraph(marca.getNome() + " — Relatório de Auditoria", titulo));
        doc.add(new Paragraph(marca.getEndereco() + "  ·  " + marca.getTelefone()
                + "  ·  " + marca.getSite(), inst));
        doc.add(new Paragraph("Período: " + inicio + " a " + fim + "  ·  "
                + eventos.size() + " evento(s)", sub));
        doc.add(Chunk.NEWLINE);

        PdfPTable t = new PdfPTable(new float[]{16, 20, 18, 20, 10, 14});
        t.setWidthPercentage(100);
        for (String h : new String[]{"Data/Hora", "Usuário", "Ação", "Recurso", "IP", "Tela"}) {
            PdfPCell c = new PdfPCell(new Phrase(h, cab));
            c.setBackgroundColor(new Color(241, 245, 249));
            c.setPadding(5);
            t.addCell(c);
        }
        for (EventoAuditoria e : eventos) {
            t.addCell(cell(e.getOcorridoEm() == null ? "" : e.getOcorridoEm().format(DATA_HORA), cel));
            t.addCell(cell(nvl(e.getUsuarioEmail()), cel));
            t.addCell(cell(nvl(e.getAcao()), cel));
            String recurso = nvl(e.getRecursoTipo());
            if (e.getDetalhe() != null) {
                recurso = recurso.isBlank() ? e.getDetalhe() : recurso + " · " + e.getDetalhe();
            }
            t.addCell(cell(recurso, cel));
            t.addCell(cell(nvl(e.getIp()), cel));
            t.addCell(cell(nvl(e.getTela()), cel));
        }
        doc.add(t);

        if (eventos.isEmpty()) {
            doc.add(new Paragraph("Nenhum evento registrado no período.", sub));
        }
        doc.close();
        return out.toByteArray();
    }

    private static PdfPCell cell(String texto, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(texto, f));
        c.setPadding(4);
        return c;
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }
}
