-- Configuration du Verifiable Credential pour les reçus de vente de coton CottonPay
-- Ce credential sera émis après chaque vente confirmée

\c mosip_esignet postgres

-- Insérer la configuration du credential CottonPaySaleReceipt
INSERT INTO certify.credential_config (
    credential_config_key_id,
    config_id,
    status,
    vc_template,
    doctype,
    sd_jwt_vct,
    context,
    credential_type,
    credential_format,
    did_url,
    key_manager_app_id,
    key_manager_ref_id,
    signature_algo,
    signature_crypto_suite,
    sd_claim,
    display,
    display_order,
    scope,
    cryptographic_binding_methods_supported,
    credential_signing_alg_values_supported,
    proof_types_supported,
    credential_subject,
    sd_jwt_claims,
    mso_mdoc_claims,
    plugin_configurations,
    credential_status_purpose,
    cr_dtimes,
    upd_dtimes
)
VALUES (
    'CottonPaySaleReceipt',
    gen_random_uuid()::VARCHAR(255),
    'active',
    -- Template VC encodé en base64 (voir ci-dessous pour le JSON décodé)
    'ewogICJAY29udGV4dCI6IFsKICAgICJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSIsCiAgICAiaHR0cHM6Ly9jb3R0b25wYXkuaW8vY29udGV4dC92MSIsCiAgICAiaHR0cHM6Ly93M2lkLm9yZy9zZWN1cml0eS9zdWl0ZXMvZWQyNTUxOS0yMDIwL3YxIgogIF0sCiAgImlzc3VlciI6ICIke19pc3N1ZXJ9IiwKICAidHlwZSI6IFsKICAgICJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsCiAgICAiQ290dG9uUGF5U2FsZVJlY2VpcHQiCiAgXSwKICAiaXNzdWFuY2VEYXRlIjogIiR7dmFsaWRGcm9tfSIsCiAgImV4cGlyYXRpb25EYXRlIjogIiR7dmFsaWRVbnRpbH0iLAogICJjcmVkZW50aWFsU3ViamVjdCI6IHsKICAgICJpZCI6ICIke19ob2xkZXJJZH0iLAogICAgImZhcm1lck5hbWUiOiAiJHtmYXJtZXJOYW1lfSIsCiAgICAiZmFybWVyTlBJIjogIiR7ZmFybWVyTlBJfSIsCiAgICAiZmFybWVyUGhvbmUiOiAiJHtmYXJtZXJQaG9uZX0iLAogICAgInNhbGVEYXRlIjogIiR7c2FsZURhdGV9IiwKICAgICJzYWxlVGltZSI6ICIke3NhbGVUaW1lfSIsCiAgICAiY290dG9uV2VpZ2h0S2ciOiAiJHtjb3R0b25XZWlnaHRLZ30iLAogICAgInVuaXRQcmljZUZDRkEiOiAiJHt1bml0UHJpY2VGQ0ZBfSIsCiAgICAidG90YWxBbW91bnRGQ0ZBIjogIiR7dG90YWxBbW91bnRGQ0ZBfSIsCiAgICAicGF5bWVudFJlZmVyZW5jZSI6ICIke3BheW1lbnRSZWZlcmVuY2V9IiwKICAgICJwYXltZW50U3RhdHVzIjogIiR7cGF5bWVudFN0YXR1c30iLAogICAgInBheW1lbnRNZXRob2QiOiAiJHtwYXltZW50TWV0aG9kfSIsCiAgICAidHJhbnNhY3Rpb25JZCI6ICIke3RyYW5zYWN0aW9uSWR9IiwKICAgICJpc3N1ZWRCeSI6ICJDb3R0b25QYXkgSUQgLSBCw6luaW4iLAogICAgImlzc3VlZEF0IjogIiR7aXNzdWVkQXR9IgogIH0KfQ==',
    NULL,
    NULL,
    'https://www.w3.org/2018/credentials/v1',
    'CottonPaySaleReceipt,VerifiableCredential',
    'ldp_vc',
    'did:web:mosip.github.io:inji-config:vc-local-ed25519',
    'CERTIFY_VC_SIGN_ED25519',
    'ED25519_SIGN',
    'EdDSA',
    'Ed25519Signature2020',
    NULL,
    '[{
        "name": "Reçu de Vente de Coton",
        "locale": "fr",
        "logo": {
            "url": "https://via.placeholder.com/150/F59E0B/FFFFFF?text=CottonPay",
            "alt_text": "CottonPay Logo"
        },
        "background_color": "#F59E0B",
        "text_color": "#FFFFFF",
        "background_image": {
            "uri": "https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=CottonPay+Receipt"
        }
    }]'::JSONB,
    ARRAY[
        'farmerName',
        'farmerNPI',
        'farmerPhone',
        'saleDate',
        'saleTime',
        'cottonWeightKg',
        'unitPriceFCFA',
        'totalAmountFCFA',
        'paymentReference',
        'paymentStatus',
        'transactionId'
    ],
    'cottonpay_sale_receipt',
    ARRAY['did:jwk'],
    ARRAY['Ed25519Signature2020'],
    '{"jwt": {"proof_signing_alg_values_supported": ["RS256", "ES256"]}}'::JSONB,
    '{
        "farmerName": {
            "display": [{"name": "Nom de l''agriculteur", "locale": "fr"}]
        },
        "farmerNPI": {
            "display": [{"name": "NPI", "locale": "fr"}]
        },
        "farmerPhone": {
            "display": [{"name": "Téléphone Mobile Money", "locale": "fr"}]
        },
        "saleDate": {
            "display": [{"name": "Date de vente", "locale": "fr"}]
        },
        "saleTime": {
            "display": [{"name": "Heure de vente", "locale": "fr"}]
        },
        "cottonWeightKg": {
            "display": [{"name": "Poids (kg)", "locale": "fr"}]
        },
        "unitPriceFCFA": {
            "display": [{"name": "Prix unitaire (FCFA/kg)", "locale": "fr"}]
        },
        "totalAmountFCFA": {
            "display": [{"name": "Montant total (FCFA)", "locale": "fr"}]
        },
        "paymentReference": {
            "display": [{"name": "Référence de paiement", "locale": "fr"}]
        },
        "paymentStatus": {
            "display": [{"name": "Statut du paiement", "locale": "fr"}]
        },
        "transactionId": {
            "display": [{"name": "ID de transaction", "locale": "fr"}]
        }
    }'::JSONB,
    NULL,
    NULL,
    '[]'::JSONB,
    ARRAY['revocation'],
    NOW(),
    NULL
) ON CONFLICT (credential_config_key_id) DO NOTHING;

-- Créer une table pour stocker les ventes de coton
CREATE TABLE IF NOT EXISTS certify.cottonpay_sales (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    farmer_name VARCHAR(255) NOT NULL,
    farmer_npi VARCHAR(16) NOT NULL,
    farmer_phone VARCHAR(20) NOT NULL,
    sale_date DATE NOT NULL,
    sale_time TIME NOT NULL,
    cotton_weight_kg DECIMAL(10,2) NOT NULL,
    unit_price_fcfa DECIMAL(10,2) NOT NULL,
    total_amount_fcfa DECIMAL(10,2) NOT NULL,
    payment_reference VARCHAR(100),
    payment_status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    credential_id VARCHAR(255),
    credential_issued BOOLEAN DEFAULT FALSE,
    cr_dtimes TIMESTAMP NOT NULL DEFAULT NOW(),
    upd_dtimes TIMESTAMP
);

CREATE INDEX idx_cottonpay_sales_farmer_npi ON certify.cottonpay_sales(farmer_npi);
CREATE INDEX idx_cottonpay_sales_transaction_id ON certify.cottonpay_sales(transaction_id);
CREATE INDEX idx_cottonpay_sales_sale_date ON certify.cottonpay_sales(sale_date);

COMMENT ON TABLE certify.cottonpay_sales IS 'Stockage des ventes de coton pour génération de credentials';
COMMENT ON COLUMN certify.cottonpay_sales.credential_id IS 'ID du Verifiable Credential généré pour cette vente';
COMMENT ON COLUMN certify.cottonpay_sales.credential_issued IS 'Indique si le credential a été émis avec succès';
