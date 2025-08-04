package com.vuokraappi.service;

import com.azure.storage.blob.*;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.sas.*;
import com.azure.storage.common.sas.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BlobStorageService {

    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name}")
    private String containerName;

    private static final Logger logger = LoggerFactory.getLogger(BlobStorageService.class);

    private final BlobServiceClient blobServiceClient;

    public BlobStorageService(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }


    public String generateSasUrlForUser(String userId) {
        // Luo blob service client
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        // Hae container client
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);

        // SAS-oikeudet
        BlobContainerSasPermission permissions = new BlobContainerSasPermission()
                .setReadPermission(true)
                .setWritePermission(true)
                .setCreatePermission(true)
                .setDeletePermission(true);

        OffsetDateTime start = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime expiry = start.plusHours(2);

        BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(expiry, permissions)
                .setStartTime(start)
                .setProtocol(SasProtocol.HTTPS_ONLY);

        // Käytä generateSas containerClientin kautta – ei tarvitse enää asettaa containerNamea erikseen
        String sasToken = containerClient.generateSas(sasValues);

        return containerClient.getBlobContainerUrl() + "?" + sasToken;
    }

    @Async
    public void deleteApartmentBlobs(UUID userId, UUID apartmentId) {
        String containerName = "apartments";
        String virtualFolder = userId.toString(); // esim: d10958dc-...

        logger.info("Poistetaan kuvat käyttäjältä {} ja asunnolta {}", userId, apartmentId);

        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);

            if (!containerClient.exists()) {
                logger.warn("Kontti '{}' ei löytynyt", containerName);
                return;
            }

            for (BlobItem blobItem : containerClient.listBlobsByHierarchy(virtualFolder + "/")) {
                String blobName = blobItem.getName();
                if (blobName.contains(apartmentId.toString())) {
                    logger.info("Poistetaan blob: {}", blobName);
                    containerClient.getBlobClient(blobName).delete();
                }
            }

        } catch (Exception e) {
            logger.error("Blobien poistaminen epäonnistui: {}", e.getMessage(), e);
        }
    }
}
