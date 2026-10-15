/*
 *    eGov  SmartCity eGovernance suite aims to improve the internal efficiency,transparency,
 *    accountability and the service delivery of the government  organizations.
 *
 *     Copyright (C) 2017  eGovernments Foundation
 *
 *     The updated version of eGov suite of products as by eGovernments Foundation
 *     is available at http://www.egovernments.org
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program. If not, see http://www.gnu.org/licenses/ or
 *     http://www.gnu.org/licenses/gpl.html .
 *
 *     In addition to the terms of the GPL license to be adhered to in using this
 *     program, the following additional terms are to be complied with:
 *
 *         1) All versions of this program, verbatim or modified must carry this
 *            Legal Notice.
 *            Further, all user interfaces, including but not limited to citizen facing interfaces,
 *            Urban Local Bodies interfaces, dashboards, mobile applications, of the program and any
 *            derived works should carry eGovernments Foundation logo on the top right corner.
 *
 *            For the logo, please refer http://egovernments.org/html/logo/egov_logo.png.
 *            For any further queries on attribution, including queries on brand guidelines,
 *            please contact contact@egovernments.org
 *
 *         2) Any misrepresentation of the origin of the material is prohibited. It
 *            is required that all modified versions of this material be marked in
 *            reasonable ways as different from the original version.
 *
 *         3) This license does not grant any rights to any user of the program
 *            with regards to rights under trademark law for use of the trade names
 *            or trademarks of eGovernments Foundation.
 *
 *   In case of any queries, you can reach eGovernments Foundation at contact@egovernments.org.
 *
 */

package com.exilant.GLEngine;
import java.io.Serializable;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.egov.commons.CChartOfAccountDetail;
import org.egov.commons.CChartOfAccounts;
import org.egov.commons.service.ChartOfAccountDetailService;
import org.egov.infra.cache.impl.ApplicationCacheManager;
import org.egov.infra.config.core.ApplicationThreadLocals;
import org.egov.infstr.services.PersistenceService;
import org.hibernate.Session;
import org.hibernate.query.NativeQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CoaCache implements Serializable {

    private static final long serialVersionUID = 1L;

    @Autowired
    @Qualifier("persistenceService")
    private PersistenceService persistenceService;

    @Autowired
    @Qualifier("chartOfAccountDetailService")
    private ChartOfAccountDetailService chartOfAccountDetailService;

    @Autowired
    private ApplicationCacheManager applicationCacheManager;

    private static final Logger LOGGER =
            Logger.getLogger(ChartOfAccounts.class);

    private static final String ROOTNODE = "/COA";
    private static final String GLACCCODENODE = "GlAccountCodes";
    private static final String GLACCIDNODE = "GlAccountIds";
    private static final String ACCOUNTDETAILTYPENODE = "AccountDetailType";

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void loadAccountData() {
        try {
            final HashMap<String, GLAccount> glAccountCodes =
                    new HashMap<>();
            final HashMap<Object, GLAccount> glAccountIds =
                    new HashMap<>();
            final HashMap<String, AccountDetailType> accountDetailType =
                    new HashMap<>();

            final Session session = persistenceService.getSession();

            final String detailSql =
                    "SELECT id AS id, name AS name, tableName AS tableName, " +
                    "description AS description, columnName AS columnName, " +
                    "attributeName AS attributeName " +
                    "FROM AccountDetailType";

            final NativeQuery<Object[]> detailQuery =
                    session.createNativeQuery(detailSql, Object[].class);

            final List<Object[]> detailRows = detailQuery.getResultList();

            for (final Object[] row : detailRows) {
                final AccountDetailType type = new AccountDetailType();

                type.setId(((Number) row[0]).intValue());
                type.setName((String) row[1]);
                type.setTableName((String) row[2]);
                type.setDescription((String) row[3]);
                type.setColumnName((String) row[4]);
                type.setAttributeName((String) row[5]);

                accountDetailType.put(type.getAttributeName(), type);
            }

            final String coaSql =
                    "SELECT id, glCode, name, isActiveForPosting, " +
                    "classification, functionReqd " +
                    "FROM chartofaccounts";

            final NativeQuery<Object[]> coaQuery =
                    session.createNativeQuery(coaSql, Object[].class);

            final List<Object[]> coaRows = coaQuery.getResultList();

            for (final Object[] row : coaRows) {
                final GLAccount account = new GLAccount();

                // GLAccount has no confirmed setId() method.
                // The account ID is used as the map key instead.
                final Object accountId = row[0];

                account.setCode((String) row[1]);
                account.setName((String) row[2]);
                account.setIsActiveForPosting(
                        row[3] != null &&
                        (Boolean.TRUE.equals(row[3]) ||
                         (row[3] instanceof Number &&
                          ((Number) row[3]).intValue() != 0)));

                account.setClassification(
                        row[4] == null ? null :
                        ((Number) row[4]).longValue());

                account.setFunctionRequired(
                        row[5] != null &&
                        (Boolean.TRUE.equals(row[5]) ||
                         (row[5] instanceof Number &&
                          ((Number) row[5]).intValue() != 0)));

                glAccountCodes.put(account.getCode(), account);
                glAccountIds.put(accountId, account);
            }

            loadParameters(glAccountCodes, glAccountIds);

            final HashMap<String, HashMap> cacheData = new HashMap<>();
            cacheData.put(ACCOUNTDETAILTYPENODE, accountDetailType);
            cacheData.put(GLACCCODENODE, glAccountCodes);
            cacheData.put(GLACCIDNODE, glAccountIds);

            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("Loading size: " + glAccountCodes.size());
            }

            applicationCacheManager.put(ROOTNODE, cacheData);

        } catch (final Exception e) {
            LOGGER.error(
                    "Error while loading Chart of Accounts cache for tenant "
                    + ApplicationThreadLocals.getTenantID(), e);
            throw e;
        }
    }

    private synchronized void loadParameters(
            final HashMap glAccountCodes,
            final HashMap glAccountIds) {

        final List<CChartOfAccountDetail> details =
                chartOfAccountDetailService.findAllBy(
                        "from CChartOfAccountDetail");

        for (final CChartOfAccountDetail detail : details) {
            final GLParameter parameter = new GLParameter();
            parameter.setDetailId(detail.getDetailTypeId().getId());
            parameter.setDetailName(
                    detail.getDetailTypeId().getAttributename());

            final GLAccount byCode =
                    getGlAccCode(detail.getGlCodeId(), glAccountCodes);
            final GLAccount byId =
                    getGlAccId(detail.getGlCodeId(), glAccountIds);

            if (byCode != null && byCode.getGLParameters() != null) {
                byCode.getGLParameters().add(parameter);
            }

            if (byId != null && byId.getGLParameters() != null) {
                byId.getGLParameters().add(parameter);
            }
        }
    }

    private static GLAccount getGlAccCode(
            final CChartOfAccounts coa, final Map glAccountCodes) {

        if (coa == null || coa.getGlcode() == null) {
            return null;
        }

        for (final Object key : glAccountCodes.keySet()) {
            if (key instanceof String &&
                    ((String) key).equalsIgnoreCase(coa.getGlcode())) {
                return (GLAccount) glAccountCodes.get(key);
            }
        }

        return null;
    }

    private static GLAccount getGlAccId(
            final CChartOfAccounts coa, final Map glAccountIds) {

        if (coa == null || coa.getId() == null) {
            return null;
        }

        return (GLAccount) glAccountIds.get(coa.getId());
    }

    private void clear() {
        applicationCacheManager.remove(ROOTNODE);
    }

    public void reLoad() {
        applicationCacheManager.remove(ROOTNODE);
        loadAccountData();
    }
}