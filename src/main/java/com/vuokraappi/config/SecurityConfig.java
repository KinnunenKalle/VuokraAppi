package com.vuokraappi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Security Filter Chain configuration for Spring Security 6.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Poistetaan CSRF-suojaus API-kutsuille
        http.csrf().disable()

            // Määritellään, mitä reittejä suojataan ja mitä ei
            .authorizeRequests()
                .requestMatchers("/graph/**").permitAll()  // Graph APIin menevät pyynnöt eivät vaadi autentikointia
                .requestMatchers("/**").permitAll()  // Kaikki reitit ovat julkisia
                .anyRequest().authenticated();    // Muut reitit vaativat autentikoinnin

        return http.build();
    }
}

