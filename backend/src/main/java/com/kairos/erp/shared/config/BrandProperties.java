package com.kairos.erp.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Marca do cliente (white-label) desta instalação — {@code app.marca.*}.
 * Espelha, no backend, a identidade definida no frontend em {@code src/brand.ts}.
 * Usada em relatórios (PDF) e em qualquer saída institucional. Sobrescrevível por
 * variáveis de ambiente ({@code APP_MARCA_NOME}, {@code APP_MARCA_COR}, …).
 *
 * <p>Defaults já apontam para o cliente geoAG (Goiânia-GO).</p>
 */
@Component
@ConfigurationProperties(prefix = "app.marca")
public class BrandProperties {

    private String nome = "geoAG";
    private String cor = "#2f6a1e";
    private String site = "https://geoag.com.br";
    private String email = "contato@geoag.com.br";
    private String telefone = "+55 (62) 3914-4516";
    private String endereco =
            "Av. Francisco de Melo, Quadra 41, Lote 06 — 74.345-210, Vila Rosa, Goiânia-GO";

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCor() {
        return cor;
    }

    public void setCor(String cor) {
        this.cor = cor;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    /** Converte a cor hex ({@code #rrggbb}) para AWT; cai no verde geoAG se inválida. */
    public java.awt.Color corAwt() {
        try {
            return java.awt.Color.decode(cor);
        } catch (RuntimeException e) {
            return new java.awt.Color(0x2f, 0x6a, 0x1e);
        }
    }
}
