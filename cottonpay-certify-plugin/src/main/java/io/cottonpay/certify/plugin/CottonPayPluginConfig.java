package io.cottonpay.certify.plugin;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration Spring pour le plugin CottonPay
 */
@Configuration
@ComponentScan(basePackages = "io.cottonpay.certify.plugin")
public class CottonPayPluginConfig {
    // Configuration automatique via @ComponentScan
}
