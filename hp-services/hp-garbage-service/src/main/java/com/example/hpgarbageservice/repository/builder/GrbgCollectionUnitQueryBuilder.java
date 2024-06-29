package com.example.hpgarbageservice.repository.builder;

import org.springframework.stereotype.Component;

@Component
public class GrbgCollectionUnitQueryBuilder {

    public static final String CREATE_QUERY = "INSERT INTO grbg_collection_unit " +
                                              "(uuid, unit_name, unit_ward, ulb_name, type_of_ulb) " +
                                              "VALUES (?, ?, ?, ?, ?)";

    public static final String UPDATE_QUERY = "UPDATE grbg_collection_unit " +
                                              "SET unit_name = ?, unit_ward = ?, ulb_name = ?, type_of_ulb = ? " +
                                              "WHERE uuid = ?";
}