package com.vuokraappi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.vuokraappi.repository")
public class VuokraAppiApplication {

    public static void main(String[] args) {
        SpringApplication.run(VuokraAppiApplication.class, args);
    }
}
