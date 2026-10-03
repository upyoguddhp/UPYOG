package org.egov.egf.autonumber.impl;

import org.egov.commons.CFiscalPeriod;
import org.egov.commons.CVoucherHeader;
import org.egov.commons.dao.FiscalPeriodHibernateDAO;
import org.egov.egf.autonumber.VouchernumberGenerator;
import org.egov.infra.config.core.ApplicationThreadLocals;
import org.egov.infra.config.core.EnvironmentSettings;
import org.egov.infra.exception.ApplicationRuntimeException;
import org.egov.infra.persistence.utils.GenericSequenceNumberGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.Serializable;

import static org.apache.commons.lang3.StringUtils.defaultIfBlank;

@Service
public class VouchernumberGeneratorImpl implements VouchernumberGenerator {

    @Autowired
    private FiscalPeriodHibernateDAO fiscalPeriodHibernateDAO;
    @Autowired
    private GenericSequenceNumberGenerator genericSequenceNumberGenerator;
    @Autowired
    private EnvironmentSettings environmentSettings;

    /**
     *
     * Format fundcode/vouchertype/seqnumber/month/financialyear but sequence is running number for a year
     *
     */
    @Override
    public String getNextNumber(final CVoucherHeader vh) {
        String voucherNumber;

        String sequenceName;

        final CFiscalPeriod fiscalPeriod = fiscalPeriodHibernateDAO.getFiscalPeriodByDate(vh.getVoucherDate());
        if (fiscalPeriod == null)
            throw new ApplicationRuntimeException("Fiscal period is not defined for the voucher date");
        final String schemaName = defaultIfBlank(ApplicationThreadLocals.getTenantID(),
                environmentSettings.defaultSchemaName());
        sequenceName = schemaName + ".sq_" + vh.getFundId().getIdentifier() + "_" + vh.getVoucherNumberPrefix() + "_" + fiscalPeriod.getName();
        final Serializable nextSequence = genericSequenceNumberGenerator.getNextSequence(sequenceName);

        voucherNumber = String.format("%s/%s/%08d/%02d/%s", vh.getFundId().getIdentifier(), vh.getVoucherNumberPrefix(),
                nextSequence, vh.getVoucherDate().getMonth() + 1, fiscalPeriod.getcFinancialYear().getFinYearRange());

        return voucherNumber;
    }
}