package com.varithon.emergency.model;

public class Varkari extends User {
    private String dindiNumber;

    public Varkari(String id, String name, String phoneNumber, String dindiNumber) {
        super(id, name, phoneNumber);
        this.dindiNumber = dindiNumber;
    }
    
    public String getDindiNumber() { return dindiNumber; }
}
