package com.varithon.emergency;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VarithonApplication {

    public static void main(String[] args) {
        SpringApplication.run(VarithonApplication.class, args);
        System.out.println("Varithon Emergency Backend is up and running!");
    }
}
