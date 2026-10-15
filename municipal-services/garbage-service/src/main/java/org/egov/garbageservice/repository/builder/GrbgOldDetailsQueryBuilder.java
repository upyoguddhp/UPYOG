package org.egov.garbageservice.repository.builder;

import org.springframework.stereotype.Component;

<<<<<<< HEAD
@Component
public class GrbgOldDetailsQueryBuilder {

    public static final String CREATE_QUERY = "INSERT INTO eg_grbg_old_details " +
                                              "(uuid, garbage_id, old_garbage_id) " +
                                              "VALUES (?, ?, ?)";

    public static final String UPDATE_QUERY = "UPDATE eg_grbg_old_details " +
                                              "SET garbage_id = ?, old_garbage_id = ? " +
                                              "WHERE uuid = ?";
=======
/**
 * Holds SQL query constants for inserting, updating, and deleting old garbage ID mapping records.
 */
@Component
public class GrbgOldDetailsQueryBuilder {

    public static final String CREATE_QUERY = "INSERT INTO ug_grbg_old_details " +
            "(uuid, garbage_id, old_garbage_id) " +
            "VALUES (?, ?, ?)";

    public static final String UPDATE_QUERY = "UPDATE ug_grbg_old_details " +
            "SET garbage_id = ?, old_garbage_id = ? " +
            "WHERE uuid = ?";

    public static final String DELETE_QUERY = "DELETE FROM ug_grbg_old_details WHERE garbage_id = ?";
>>>>>>> niua-upstream/niua-dev-2.0
}
