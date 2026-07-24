package com.kairos.erp.bi.web;

import com.kairos.erp.bi.app.BiService;
import com.kairos.erp.bi.app.BiService.Indicadores;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Indicadores de Business Intelligence do tenant (etapa 076). */
@RestController
@RequestMapping("/api/v1/bi")
public class BiController {

    private final BiService service;

    public BiController(BiService service) {
        this.service = service;
    }

    @GetMapping("/indicadores")
    public Indicadores indicadores() {
        return service.indicadores();
    }
}
