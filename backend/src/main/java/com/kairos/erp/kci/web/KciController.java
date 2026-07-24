package com.kairos.erp.kci.web;

import com.kairos.erp.kci.app.BaseConhecimentoKci.Sintoma;
import com.kairos.erp.kci.app.DiagnosticoService;
import com.kairos.erp.kci.app.DiagnosticoService.Diagnostico;
import com.kairos.erp.kci.app.ProblemasCronicosService;
import com.kairos.erp.kci.app.ProblemasCronicosService.Cronico;
import com.kairos.erp.kci.app.BaseConhecimentoIaService;
import com.kairos.erp.kci.app.BaseConhecimentoIaService.ItemConhecimento;
import com.kairos.erp.kci.app.BaseConhecimentoIaService.SugestaoFabricante;
import com.kairos.erp.kci.app.RelatorioIaService;
import com.kairos.erp.kci.app.RelatorioIaService.RelatorioIa;
import com.kairos.erp.kci.app.SugestaoService;
import com.kairos.erp.kci.app.SugestaoService.Sugestao;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Conlor IA (KCI) — co-piloto da oficina: diagnóstico por sintomas, sugestões
 * ativas por correlação de peças, problemas crônicos por modelo e relatório
 * inteligente exportável (PDF, CSV, Excel).
 */
@RestController
@RequestMapping("/api/v1/kci")
public class KciController {

    private final DiagnosticoService diagnostico;
    private final SugestaoService sugestoes;
    private final ProblemasCronicosService cronicos;
    private final RelatorioIaService relatorio;
    private final BaseConhecimentoIaService base;

    public KciController(DiagnosticoService diagnostico, SugestaoService sugestoes,
                         ProblemasCronicosService cronicos, RelatorioIaService relatorio,
                         BaseConhecimentoIaService base) {
        this.diagnostico = diagnostico;
        this.sugestoes = sugestoes;
        this.cronicos = cronicos;
        this.relatorio = relatorio;
        this.base = base;
    }

    @GetMapping("/sintomas")
    public List<Sintoma> sintomas() {
        return diagnostico.sintomasConhecidos();
    }

    public record DiagnosticoRequest(@NotNull List<String> sintomas) {
    }

    @PostMapping("/diagnostico")
    public List<Diagnostico> diagnosticar(@Valid @RequestBody DiagnosticoRequest req) {
        return diagnostico.diagnosticar(req.sintomas());
    }

    public record SugestoesRequest(@NotNull List<String> pecas) {
    }

    /** Sugestões ativas: correlaciona as peças do orçamento e infere a causa. */
    @PostMapping("/sugestoes")
    public List<Sugestao> sugestoes(@Valid @RequestBody SugestoesRequest req) {
        return sugestoes.analisar(req.pecas());
    }

    /** Problemas crônicos por modelo (mapeamento histórico). */
    @GetMapping("/cronicos")
    public List<Cronico> cronicos() {
        return cronicos.cronicos();
    }

    /** Relatório inteligente consolidado (JSON). */
    @GetMapping("/relatorio")
    public RelatorioIa relatorio() {
        return relatorio.montar();
    }

    @GetMapping(value = "/relatorio.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> relatorioPdf() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=relatorio-ia.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(relatorio.gerarPdf());
    }

    @GetMapping(value = "/relatorio.csv", produces = "text/csv")
    public ResponseEntity<byte[]> relatorioCsv() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-ia.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(relatorio.gerarCsv().getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping(value = "/relatorio.xls", produces = "application/vnd.ms-excel")
    public ResponseEntity<byte[]> relatorioExcel() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-ia.xls")
                .contentType(MediaType.parseMediaType("application/vnd.ms-excel"))
                .body(relatorio.gerarExcelHtml().getBytes(StandardCharsets.UTF_8));
    }

    // --- Base de conhecimento importável + sugestões ao fabricante ----------

    @GetMapping("/base")
    public List<ItemConhecimento> base() {
        return base.listar();
    }

    @PostMapping("/base/importar")
    @PreAuthorize("hasRole('ADMIN')")
    public BaseConhecimentoIaService.ImportacaoResumo importarBase(
            @org.springframework.web.bind.annotation.RequestParam("arquivo")
            org.springframework.web.multipart.MultipartFile arquivo) throws java.io.IOException {
        return base.importar(new String(arquivo.getBytes(), StandardCharsets.UTF_8));
    }

    @GetMapping("/sugestoes-fabricante")
    public List<SugestaoFabricante> sugestoesFabricante() {
        return base.sugestoesFabricante();
    }
}

