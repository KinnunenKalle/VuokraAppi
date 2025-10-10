package com.vuokraappi.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@Controller
@RequestMapping("/users")
public class StrongAuthController {

    @GetMapping("/strongAuthentication")
    public ResponseEntity<Void> startStrongAuthentication() {

        // Ohjataan käyttäjä Signicat OIDC flow’n alkuun:
        return ResponseEntity.status(302)
                .location(URI.create("https://ioxx-oy.sandbox.signicat.com/auth/open/connect/authorize?client_id=sandbox-brave-knee-874&response_type=code&redirect_uri=https://oauth.tools/callback/code&state=1759392493946-sGf&scope=openid%20profile%20nin&code_challenge=0pvv8p-pXjBszypz7nXfxg5rfyKta7FkgvtOrPBqsH8&code_challenge_method=S256&prompt=login"))
                .build();
    }

    @GetMapping("/strongAuthentication/result")
    @ResponseBody
    public String strongAuthenticationResult(@AuthenticationPrincipal OidcUser oidcUser) {
        if (oidcUser == null) {
            return "Tunnistus epäonnistui.";
        }

        // Voit hakea attribuutteja Signicatilta
        String name = oidcUser.getFullName();
        String subject = oidcUser.getSubject();
        String nationalId = oidcUser.getAttribute("national_id");

        return "Tunnistus onnistui käyttäjälle: " + name + 
               " (sub=" + subject + ", hetu=" + nationalId + ")";
    }
}
