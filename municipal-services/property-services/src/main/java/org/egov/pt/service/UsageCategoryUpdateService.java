package org.egov.pt.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.egov.pt.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UsageCategoryUpdateService {

	@Autowired
	private PropertyRepository propertyRepository;

	@Transactional
	public void updateUsageCategory() {

		List<Map<String, Object>> data = propertyRepository.getUsageCategoryData();

		for (Map<String, Object> row : data) {

			String id = String.valueOf(row.get("id"));

			String buildingType = Optional.ofNullable(row.get("useOfBuilding")).map(Object::toString).map(String::trim)
					.orElse("").replaceAll("\\s+", " ").replace("''", "'");

			String category = getCategory(buildingType);

			if (category != null) {

				propertyRepository.updateUsageCategory(category, id);

				log.info("Updated ID {} with category {}", id, category);
			}
		}
	}

	private String getCategory(String value) {

	    if (value == null) {
	        return "Others";
	    }

	    value = value.trim();

	    // Residential
	    if (value.equalsIgnoreCase("Resdential")
	            || value.equalsIgnoreCase("Resedential")
	            || value.equalsIgnoreCase("Residencial")
	            || value.equalsIgnoreCase("residential")
	            || value.equalsIgnoreCase("Residential")
	            || value.equalsIgnoreCase("RESIDENTIAL")
	            || value.equalsIgnoreCase("Residential")
	            || value.equalsIgnoreCase("Residential Purpose")
	            || value.equalsIgnoreCase("Residential,Residential")
	            || value.equalsIgnoreCase("Residentialn")
	            || value.equalsIgnoreCase("Ressidential")
	            || value.equalsIgnoreCase("ressidential")
	            || value.equalsIgnoreCase("Ressidential")
	            || value.equalsIgnoreCase("self")
	            || value.equalsIgnoreCase("Self Rersidential")
	            || value.equalsIgnoreCase("Self Residential")
	            || value.equalsIgnoreCase("Self Residential")
	            || value.equalsIgnoreCase("Let-out Resedential")
	            || value.equalsIgnoreCase("Let out Residential")
	            || value.equalsIgnoreCase("Let Out Residential")
	            || value.equalsIgnoreCase("Let out Residential")
	            || value.equalsIgnoreCase("Value for Let out  residential")
	            || value.equalsIgnoreCase("Value for let out Residential")
	            || value.equalsIgnoreCase("Value for Let Out residential")
	            || value.equalsIgnoreCase("value for Let Out residential")
	            || value.equalsIgnoreCase("Value for self residential")
	            || value.equalsIgnoreCase("value for self residential")
	            || value.equalsIgnoreCase("Value for self Residential")
	            || value.equalsIgnoreCase("Value of self residential")) {

	        return "Residential";
	    }

	    // Commercial
	    else if (value.equalsIgnoreCase("A. Hotel above builtup area of 2000 sqm MNC Show Room, Restaurants, Industries & Factory")
	            || value.equalsIgnoreCase("B. Hotel having builtup area between 1000-2000sqm and show room above 1000 sqmMNC Show Room, Restaurants, Industries & Factory")
	            || value.equalsIgnoreCase("C- Other Hotels, Bars, Restaurant, Banks, ATMs, Show Rooms, Cell Centre, Marriage Hall, Travel Agency, Mobile Tower, Coaching Centre, Shops.")
	            || value.equalsIgnoreCase("C. Other hotels, Bars, Restaurant, Banks, ATM,Show Room, Call Centre, Marrige hall, Travel Agency, Mobile tower, Coaching centre, Shops")
	            || value.equalsIgnoreCase("COMMERCIAAL")
	            || value.equalsIgnoreCase("commercial")
	            || value.equalsIgnoreCase("Commercial")
	            || value.equalsIgnoreCase("COMMERCIAL")
	            || value.equalsIgnoreCase("Commercial")
	            || value.equalsIgnoreCase("Commercial Let Out")
	            || value.equalsIgnoreCase("Commercial Self")
	            || value.equalsIgnoreCase("Commerial")
	            || value.equalsIgnoreCase("E-Godowns, Dhaba, Stall, Commercial used plot of land and other types of properties not covered under (A to D).")
	            || value.equalsIgnoreCase("E. Godowns, Dhaba,Stall, Commercial used plot of land and other types of properties not covered under (A to D)")
	            || value.equalsIgnoreCase("Godowns, Dhaba, stall and other types of properties not covered under (A to D)")
	            || value.equalsIgnoreCase("Godowns, Dhabas, Stall and Other types of properties not covered under (A to D)")
	            || value.equalsIgnoreCase("Godowns, Dhabas, Stall and Other types of Properties not covered under (A to D)")
	            || value.equalsIgnoreCase("Gowdowns, Dhabas, Stall and other types of properties not covered under (A to D) less then 100qm.mtr")
	            || value.equalsIgnoreCase("Hotel having built-up area between 1 to 300 sq.mtr and show room 1 sq.mtr.to 300 sq. mtr.")
	            || value.equalsIgnoreCase("Hotel having built-up area between 500 to 1000 Sq. mtr. and Show Room above 1000 Sq. Mtr.")
	            || value.equalsIgnoreCase("Hotel having built-up area of 300 sq. mtr, MNC shows Rooms and Restaurant.")
	            || value.equalsIgnoreCase("Hotel having buit-up area between 1000-2000 Sq mtr and show room above 1000 Sq mtr")
	            || value.equalsIgnoreCase("Hotels above built-up area of 1000 Sq.  mtr., MNC Show Rooms and Restaurant")
	            || value.equalsIgnoreCase("Let-out Commercial")
	            || value.equalsIgnoreCase("Non- Residential")
	            || value.equalsIgnoreCase("Non-Residential")
	            || value.equalsIgnoreCase("Non-Residential")
	            || value.equalsIgnoreCase("Non-Residential (Dhabas, Gowdowns, Stalls, Offices, Dharamshala, Sarai, Factory)")
	            || value.equalsIgnoreCase("Non-Residential (Hotels, Restaurtants, Guest House, Banks, ATMs, Parking, Telecom Tower")
	            || value.equalsIgnoreCase("Non-residential purpose & utility")
	            || value.equalsIgnoreCase("Non - Residential")
	            || value.equalsIgnoreCase("Non Rersidential")
	            || value.equalsIgnoreCase("Non Residential")
	            || value.equalsIgnoreCase("Non Residential (A) Hotels above built-up-area of 2000Sq. mtr., MNC Show Rooms and Restaurat")
	            || value.equalsIgnoreCase("Non Residential (A) Hotels above Built up area of 300 Sq mtr , MNC Show Rooms and restaurant")
	            || value.equalsIgnoreCase("Non Residential (B) Hotel having built-up area between 100 to 300 sq. mtr. and showroom 100 sq. mtr. to 300 sq. mtr.")
	            || value.equalsIgnoreCase("Non Residential (C) Other hotels, bars, restaurant, banks, ATMs, show rooms, call centre, marriage hall, theatre, travel agency, mobile tower, coaching less than 100 sq. mtr.")
	            || value.equalsIgnoreCase("Non Residential (E) Godowns, stores, dhabas, stall and other types of properties not covered under (A to D) less than 100 sq. mtrs.")
	            || value.equalsIgnoreCase("Non Residential occupancy (C) Other Hotals, Bars,Restaurant, Banks, ATMs,Show Rooms, Call Centre, Marriage Hall, Travel Agency, Mobile Towers, Coaching")
	            || value.equalsIgnoreCase("Non Residential occupancy (C) Other Hotals, Bars,Restaurant, Banks, ATMs,Show Rooms, Call Centre, Marriage Hall, TRavel Agency, Mobile Towers, CoaCHING.")
	            || value.equalsIgnoreCase("Other Hotels, Banks, ATMs, Call Centre, Marriage Hall, Travel Agency, Gym, Dharamshala, Raray, Covered Parking, Coaching Centre, Industries etc.")
	            || value.equalsIgnoreCase("Other Hotels, Bars, Restaurants, Bank,ATMS, Show Rooms, Call Center, Marriage Hall, Travel Agency, Mobile Towns, Coaching less than 100 sq.mtr")
	            || value.equalsIgnoreCase("Other Hotels, Bars, Restaurats, Banks, ATM's, Showrooms, Call centers, Marriage hall, Travell agency, Mobile towers, coaching centers")
	            || value.equalsIgnoreCase("Other Hotels, Bars, Restaurats, Banks, ATM's, Showrooms, Call centers, Marriage hall, Travell agency, Mobile towers, coaching centers-up area between 1000-2000 Sq mtr and show room above 1000 Sq mtr")) {

	        return "Commercial";
	    }

	    // Mixed Use
	    else if (value.equalsIgnoreCase("Mixed Property")
	            || value.equalsIgnoreCase("Residential  n commercial")
	            || value.equalsIgnoreCase("Residential/Commercial")
	            || value.equalsIgnoreCase("Self Residential and Commercial")
	            || value.equalsIgnoreCase("Let out Residential and Commercial")
	            || value.equalsIgnoreCase("Shop & Residentialt")
	            || value.equalsIgnoreCase("Hotel/Guest house/Rest House/ Restaurant/ Banks/ Industries/Hospital/Clinic/Hostel/Collage/School/Office")
	            || value.equalsIgnoreCase("Non-Residential (Shops, Colleges, Showrooms, Edu. Institution, Ropeway, Lift, Hospital)")) {

	        return "Mixed Use";
	    }

	    // Institutional
	    else if (value.equalsIgnoreCase("D-Schools, Colleges, Education Institutions, Offices, Hostel, Hospital, Theater, Clubs, Paying Guest House (PGs).")
	            || value.equalsIgnoreCase("D. School, Colleges, Education Institutions, Offices, Hostel,Hospital,Theatre, Clubs, Paying Guest (PG), Guest House")
	            || value.equalsIgnoreCase("Non Residential (D) Shops, school, colleges, educational institutions, offices, hotel, hospital, clubs, paying guest house(PGs), guest house less than 100 sq. mtr.")
	            || value.equalsIgnoreCase("Non Residential (D) Shops, School, Colleges, Eductional Institutions, Offices, Hostel, Hospital, Theatre, Clubs, Paying Guest House (PGs), Guest House")
	            || value.equalsIgnoreCase("office use")
	            || value.equalsIgnoreCase("Shop, Schools, Colleges, Education institute ,Offices, Hostel, Hospital, theatre, Clubs, paying Guest House (PGs) Guest House less then 100 sq.mtr.")
	            || value.equalsIgnoreCase("Shops, Hostel, Hospital, Theatre, Clubs, Paying, Guest  Houses")
	            || value.equalsIgnoreCase("Shops, school, collage, Education institutions, offices, hostels, hospitals, theater, clubs, paying guest house (PG's), Guest house")
	            || value.equalsIgnoreCase("Shops, School, Colleges, Educational Institutions, Offices, Hostel, Hospital, Theatre, Clubs, Paying Guest House (PGs) Guest House")
	            || value.equalsIgnoreCase("Shops, Schools, Colleges, Educational Institutions, Offices, Hostel, Hospital, Theatre, Clubs, Paying Guest House (PGs), Open Parking")) {

	        return "Institutional";
	    }

	    // Public and Semi Public
	    else if (value.equalsIgnoreCase("Government")
	            || value.equalsIgnoreCase("tGovt-Office")
	            || value.equalsIgnoreCase("ULB")) {

	        return "Public and Semi Public";
	    }

	    // Industrial
	    else if (value.equalsIgnoreCase("factory")) {

	        return "Industrial";
	    }

	    // Vacant land
	    else if (value.equalsIgnoreCase("OPEN")
	            || value.equalsIgnoreCase("PLOT")) {

	        return "Vacant land";
	    }

	    // Heritage
	    else if (value.equalsIgnoreCase("Heritage")) {

	        return "Heritage";
	    }

	    // Religious
	    else if (value.equalsIgnoreCase("Religious")) {

	        return "Religious";
	    }

	    // Recreational
	    else if (value.equalsIgnoreCase("Recreational")) {

	        return "Recreational";
	    }

	    // Others
	    else if (value.equalsIgnoreCase("Cowshed/Dhara")
	            || value.equalsIgnoreCase("Let Out Property")
	            || value.equalsIgnoreCase("NU")
	            || value.equalsIgnoreCase("NULL")
	            || value.equalsIgnoreCase("RCC FRAME STRUCTURE AND LANTER")
	            || value.equalsIgnoreCase("Under Construction")) {

	        return "Others";
	    }

	    return "Others";
	}
}