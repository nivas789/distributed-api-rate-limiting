package com.rateguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DistributedApiRateLimitingApplication {

	public static void main(String[] args) {
		SpringApplication.run(DistributedApiRateLimitingApplication.class, args);
	}

}
