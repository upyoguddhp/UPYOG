package org.upyog.chb.repository;

import org.springframework.stereotype.Repository;

<<<<<<< HEAD
@Repository
//@Slf4j
public class RedisRepository {
	
	/*
	 * @Autowired private RedisTemplate<String, CommunityHallSlotAvailabilityDetail>
	 * redisTemplate;
	 * 
	 * public void saveSlots(CommunityHallSlotAvailabilityDetail availabilityDetail)
	 * { redisTemplate.opsForHash().put(availabilityDetail.getTenantId(),
	 * getKey(availabilityDetail), availabilityDetail); }
	 * 
	 * public CommunityHallSlotAvailabilityDetail
	 * getSlots(CommunityHallSlotAvailabilityDetail availabilityDetail) {
	 * log.info("Fetching data for key : " + availabilityDetail.getTenantId() +
	 * " hashkey : " + getKey(availabilityDetail)); return
	 * (CommunityHallSlotAvailabilityDetail)
	 * redisTemplate.opsForHash().get(availabilityDetail.getTenantId(),
	 * getKey(availabilityDetail)); }
	 * 
	 * public String getKey(CommunityHallSlotAvailabilityDetail availabilityDetail)
	 * { return availabilityDetail.getTenantId() + ":" +
	 * availabilityDetail.hashCode(); }
	 */
=======
/**
 * Placeholder repository for future Redis-backed slot availability caching.
 */
@Repository
public class RedisRepository {
>>>>>>> niua-upstream/niua-dev-2.0
}
