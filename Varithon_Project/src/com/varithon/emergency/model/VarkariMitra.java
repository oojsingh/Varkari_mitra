package com.varithon.emergency.model;

public class VarkariMitra extends User {
    private String volunteerId;

    public VarkariMitra(String id, String name, String phoneNumber, String volunteerId) {
        super(id, name, phoneNumber);
        this.volunteerId = volunteerId;
    }

    public String getVolunteerId() { return volunteerId; }
}
