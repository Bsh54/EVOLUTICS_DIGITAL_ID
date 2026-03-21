package io.cottonpay.certify.plugin;

import foundation.identity.jsonld.JsonLDObject;
import io.mosip.certify.api.dto.VCRequestDto;
import io.mosip.certify.api.dto.VCResult;
import io.mosip.certify.api.exception.VCIExchangeException;
import io.mosip.certify.api.spi.VCIssuancePlugin;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class CottonPayVCIssuancePlugin implements VCIssuancePlugin {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String CREDENTIAL_TYPE = "CottonPaySaleReceipt";

    // Méthode partagée pour récupérer les données de la base
    private Map<String, Object> getCredentialData(String holderId) {
        String query = "SELECT transaction_id, farmer_name, farmer_npi, farmer_phone, " +
                       "sale_date, sale_time, cotton_weight_kg, unit_price_fcfa, total_amount_fcfa, " +
                       "payment_reference, payment_status, payment_method " +
                       "FROM certify.cottonpay_sales " +
                       "WHERE farmer_npi = ? AND credential_issued = false " +
                       "ORDER BY cr_dtimes DESC LIMIT 1";

        List<Map<String, Object>> sales = jdbcTemplate.queryForList(query, holderId);

        if (sales.isEmpty()) {
            log.warn("⚠️ Aucune vente non traitée trouvée pour: {}", holderId);
            throw new VCIExchangeException("NO_SALE_FOUND", "Aucune vente en attente pour cet agriculteur");
        }

        Map<String, Object> sale = sales.get(0);
        log.info("✅ Vente trouvée: {}", sale.get("transaction_id"));

        Map<String, Object> credentialSubject = new HashMap<>();
        credentialSubject.put("id", "did:cottonpay:" + holderId);
        credentialSubject.put("farmerName", sale.get("farmer_name"));
        credentialSubject.put("farmerNPI", sale.get("farmer_npi"));
        credentialSubject.put("farmerPhone", sale.get("farmer_phone"));

        LocalDate saleDate = ((java.sql.Date) sale.get("sale_date")).toLocalDate();
        LocalTime saleTime = ((java.sql.Time) sale.get("sale_time")).toLocalTime();
        credentialSubject.put("saleDate", saleDate.format(DateTimeFormatter.ISO_DATE));
        credentialSubject.put("saleTime", saleTime.format(DateTimeFormatter.ISO_TIME));

        credentialSubject.put("cottonWeightKg", sale.get("cotton_weight_kg").toString());
        credentialSubject.put("unitPriceFCFA", sale.get("unit_price_fcfa").toString());
        credentialSubject.put("totalAmountFCFA", sale.get("total_amount_fcfa").toString());
        credentialSubject.put("paymentReference", sale.get("payment_reference"));
        credentialSubject.put("paymentStatus", sale.get("payment_status"));
        credentialSubject.put("paymentMethod", sale.get("payment_method"));
        credentialSubject.put("transactionId", sale.get("transaction_id"));
        credentialSubject.put("issuedBy", "CottonPay ID - Bénin");

        // Marquer la vente comme traitée
        String updateQuery = "UPDATE certify.cottonpay_sales SET credential_issued = true, upd_dtimes = CURRENT_TIMESTAMP WHERE transaction_id = ?";
        jdbcTemplate.update(updateQuery, sale.get("transaction_id"));

        return credentialSubject;
    }

    @Override
    public VCResult<JsonLDObject> getVerifiableCredentialWithLinkedDataProof(
            VCRequestDto vcRequestDto,
            String holderId,
            Map<String, Object> identityDetails) throws VCIExchangeException {

        log.info("🌾 CottonPay Plugin (LDP): Génération du credential pour holder: {}", holderId);
        try {
            Map<String, Object> subject = getCredentialData(holderId);
            VCResult<JsonLDObject> result = new VCResult<>();

            // Set credential subject correctly as a map using the base method inherited by VCResult,
            // or by building JsonLDObject depending on library version.
            // Some library versions accept JsonLDObject.fromJsonObject, others just use Map.
            // Since VCResult uses generic T, but underlying representation is often Map or JSON Node.
            result.setCredentialSubject((JsonLDObject) JsonLDObject.fromJsonObject(subject));

            result.setFormat("ldp_vc");
            return result;
        } catch (Exception e) {
            log.error("❌ Erreur LDP", e);
            throw new VCIExchangeException("CREDENTIAL_GENERATION_FAILED", e.getMessage());
        }
    }

    @Override
    public VCResult<String> getVerifiableCredential(
            VCRequestDto vcRequestDto,
            String holderId,
            Map<String, Object> identityDetails) throws VCIExchangeException {

        log.info("🌾 CottonPay Plugin (JWT): Génération du credential pour holder: {}", holderId);
        try {
            Map<String, Object> subject = getCredentialData(holderId);
            VCResult<String> result = new VCResult<>();
            // Assuming we serialize the subject to a string for JWT format if T=String,
            // or maybe it uses the generic method that accepts Map, but since the type parameter is String,
            // we should pass a serialized string. Let's pass the serialized string of the map just to be safe.
            String subjectJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(subject);
            result.setCredentialSubject(subjectJson);
            result.setFormat("jwt_vc");
            return result;
        } catch (Exception e) {
            log.error("❌ Erreur JWT", e);
            throw new VCIExchangeException("CREDENTIAL_GENERATION_FAILED", e.getMessage());
        }
    }
}