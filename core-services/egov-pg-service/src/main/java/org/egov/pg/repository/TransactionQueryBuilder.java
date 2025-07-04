package org.egov.pg.repository;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.egov.pg.web.models.TransactionCriteria;
import org.egov.pg.web.models.TransactionCriteriaV2;
import org.springframework.util.CollectionUtils;

class TransactionQueryBuilder {
    private static final String SEARCH_TXN_SQL = "SELECT pg.* FROM eg_pg_transactions pg ";

    private TransactionQueryBuilder() {
    }

    static String getPaymentSearchQueryByCreatedTimeRange(TransactionCriteria transactionCriteria, List<Object> preparedStmtList) {
        String query = buildQuery(transactionCriteria, preparedStmtList);
		if (!Objects.isNull(transactionCriteria.getStartDateTime())
				&& !Objects.isNull(transactionCriteria.getEndDateTime())) {
			query = checkLastUpdatedTime(transactionCriteria, query, preparedStmtList);
		}
        query = addOrderByClause(query);
        query = addPagination(query, transactionCriteria, preparedStmtList);
        return query;
    }
    
	private static String checkLastUpdatedTime(TransactionCriteria transactionCriteria, String query,
			List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(query);

		if (!query.contains("WHERE"))
			builder.append(" WHERE ");
		else
			builder.append(" AND ");

		builder.append(" pg.last_modified_time >= ? ");
		preparedStmtList.add(transactionCriteria.getStartDateTime());
		builder.append(" AND ");
		builder.append(" pg.last_modified_time <= ? ");
		preparedStmtList.add(transactionCriteria.getEndDateTime());

		return builder.toString();
	}
    
	static String getPaymentSearchQueryByCreatedTimeRange(TransactionCriteriaV2 transactionCriteriaV2,
			List<Object> preparedStmtList) {
		String query = buildQuery(transactionCriteriaV2, preparedStmtList);
		query = addOrderByClause(query);
		query = addPagination(query, transactionCriteriaV2, preparedStmtList);
		return query;
	}

    static String getPaymentSearchQueryByCreatedTimeRange(TransactionCriteria transactionCriteria, Long startTime, Long endTime, List<Object> preparedStmtList) {
        return buildQueryForTimeRange(transactionCriteria, startTime, endTime, preparedStmtList);
    }

    private static String buildQueryForTimeRange(TransactionCriteria transactionCriteria, Long startTime, Long endTime, List<Object> preparedStmtList) {
        String preparedQuery = buildQuery(transactionCriteria, preparedStmtList);

        StringBuilder builder = new StringBuilder(preparedQuery);

        if (!preparedQuery.contains("WHERE"))
            builder.append(" WHERE ");
        else
            builder.append(" AND ");

        builder.append(" pg.created_time >= ? ");
        preparedStmtList.add(startTime);
        builder.append(" AND ");
        builder.append(" pg.created_time <= ? ");
        preparedStmtList.add(endTime);

        return builder.toString();
    }


	private static String buildQuery(TransactionCriteria transactionCriteria, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(TransactionQueryBuilder.SEARCH_TXN_SQL);
		boolean isAppendAndClause = true;
		builder.append(" WHERE 1=1 ");

		if (!Objects.isNull(transactionCriteria.getTenantId())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.tenant_id = ").append("'" + transactionCriteria.getTenantId() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getTxnId())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_id = ").append("'" + transactionCriteria.getTxnId() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getUserUuid())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.user_uuid = ").append("'" + transactionCriteria.getUserUuid() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getBillId())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.bill_id = ").append("'" + transactionCriteria.getBillId() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getTxnStatus())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_status = ").append("'" + transactionCriteria.getTxnStatus() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getConsumerCode())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.consumer_code = ").append("'" + transactionCriteria.getConsumerCode() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getReceipt())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.receipt = ").append("'" + transactionCriteria.getReceipt() + "'");
		}
		
		if (!Objects.isNull(transactionCriteria.getGateway())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.gateway = ").append("'" + transactionCriteria.getGateway() + "'");
		}

		if (!Objects.isNull(transactionCriteria.getTxnSettlementStatus())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_settlement_status = ")
					.append("'" + transactionCriteria.getTxnSettlementStatus() + "'");
		}

		if (!CollectionUtils.isEmpty(transactionCriteria.getTxnSettlementStatusses())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_settlement_status IN ( ")
					.append(getQueryForCollection(new ArrayList<>(transactionCriteria.getTxnSettlementStatusses()),
							preparedStmtList))
					.append(" )");
		}
		
		if (!CollectionUtils.isEmpty(transactionCriteria.getNotTxnSettlementStatusses())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_settlement_status NOT IN ( ")
			.append(getQueryForCollection(new ArrayList<>(transactionCriteria.getNotTxnSettlementStatusses()),
					preparedStmtList))
			.append(" )");
		}

		return builder.toString();
	}
    
	private static String buildQuery(TransactionCriteriaV2 transactionCriteriaV2, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder(TransactionQueryBuilder.SEARCH_TXN_SQL);

		boolean isAppendAndClause = true;
		builder.append(" WHERE 1=1");

		if (!CollectionUtils.isEmpty(transactionCriteriaV2.getTenantIds())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.tenant_id IN ( ").append(
					getQueryForCollection(new ArrayList<>(transactionCriteriaV2.getTenantIds()), preparedStmtList))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(transactionCriteriaV2.getTxnIds())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_id IN ( ")
					.append(getQueryForCollection(new ArrayList<>(transactionCriteriaV2.getTxnIds()), preparedStmtList))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(transactionCriteriaV2.getUserUuids())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.user_uuid IN ( ").append(
					getQueryForCollection(new ArrayList<>(transactionCriteriaV2.getUserUuids()), preparedStmtList))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(transactionCriteriaV2.getTxnStatus())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.txn_status IN ( ").append(
					getQueryForCollection(new ArrayList<>(transactionCriteriaV2.getTxnStatus()), preparedStmtList))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(transactionCriteriaV2.getConsumerCodes())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.consumer_code IN ( ").append(
					getQueryForCollection(new ArrayList<>(transactionCriteriaV2.getConsumerCodes()), preparedStmtList))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(transactionCriteriaV2.getReceipts())) {
			isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, builder);
			builder.append(" pg.receipt IN ( ").append(
					getQueryForCollection(new ArrayList<>(transactionCriteriaV2.getReceipts()), preparedStmtList))
					.append(" )");
		}

		return builder.toString();
	}

	private static boolean addAndClauseIfRequired(final boolean appendAndClauseFlag, final StringBuilder queryString) {
		if (appendAndClauseFlag)
			queryString.append(" AND");

		return true;
	}

	private static String getQueryForCollection(List<?> ids, List<Object> preparedStmtList) {
		StringBuilder builder = new StringBuilder();
		Iterator<?> iterator = ids.iterator();
		while (iterator.hasNext()) {
			builder.append(" ?");
			preparedStmtList.add(iterator.next());

			if (iterator.hasNext())
				builder.append(",");
		}
		return builder.toString();
	}

	private static String addPagination(String query, TransactionCriteria transactionCriteria, List<Object>
            preparedStmtList){
		if(transactionCriteria.getIsSchedulerCall()) {
			return query;
		}
        if (transactionCriteria.getLimit() > 0) {
            query = query + " limit ? ";
            preparedStmtList.add(transactionCriteria.getLimit());
        }
        if (transactionCriteria.getOffset() > 0) {
            query = query + " offset ? ";
            preparedStmtList.add(transactionCriteria.getOffset());
        }

        return query;
    }
    
    private static String addPagination(String query, TransactionCriteriaV2 transactionCriteriaV2, List<Object>
    preparedStmtList){
    	if (transactionCriteriaV2.getLimit() > 0) {
    		query = query + " limit ? ";
    		preparedStmtList.add(transactionCriteriaV2.getLimit());
    	}
    	if (transactionCriteriaV2.getOffset() > 0) {
    		query = query + " offset ? ";
    		preparedStmtList.add(transactionCriteriaV2.getOffset());
    	}
    	
    	return query;
    }

    private static String addOrderByClause(String query){
        return query + " order by pg.created_time desc ";
    }

}
