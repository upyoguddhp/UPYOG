package org.egov.pt.util;

import java.util.Arrays;
import java.util.List;

public class UsageCategoryMapper {

	public static String map(String value) {
		if (value == null)
			return "Others";

		String v = value.trim();
		if (v.isEmpty())
			return "Others";

		List<String> residential = Arrays.asList("Resdential", "Resedential", "Residential", "Residencial",
				"residential", "RESIDENTIAL", "Residential Purpose", "Residential,Residential", "Residentialn",
				"Ressidential", "ressidential", "self", "Self Rersidential", "Self Residential", "Let-out Resedential",
				"Let out Residential", "Let Out Residential", "Value for Let out  residential",
				"Value for let out Residential", "Value for Let Out residential", "value for Let Out residential",
				"Value for self residential", "value for self residential", "Value for self Residential",
				"Value of self residential", "govt. residences", "let-out residential", "self-residential");

		List<String> commercial = Arrays.asList(
				//------------
				"atms", "banks", "commercial (above 500 sq. mtr.)", "commercial (between 100 to 200 sq. mtr.)",
				"commercial (less than 100 mtr. )", "commercial (less than 100 sq. mtr.)", "dhabas", "hotel", "hotels",
				"gowdons", "hotel above built-up area of 2000 sq mtr show rooms, mnc, restaurants",
				"non- residential commercial", "non -residential", "non residential", "non residential",
				"other hotels, banks, atms, call centre, marriage hall, travel agency, gym, dharamshala, raray, covered parking, coaching centre, industries etc.",
				"other hotels, bars, restaurants, bank,atms, show rooms, call center, marriage hall, travel agency, mobile towns, coaching less than 100 sq.mtr",
				"other hotels, bars, restaurats, banks, atm''s, showrooms, call centers, marriage hall, travell agency, mobile towers, coaching centers",
				"other hotels, bars, restaurats, banks, atm''s, Showrooms, Call centers, marriage hall, travell agency, mobile towers, coaching centers-up area between 1000-2000 sq mtr and show room above 1000 sq mtr ",
				"private guest houses/home stay", "non- residential commercial", "store", "shop", "workshops",
				"restaurants", "restaurant", "private offices", "private insurance companies",
				//-----
				
				"A. Hotel above builtup area of 2000 sqm MNC Show Room, Restaurants, Industries & Factory",
				"B. Hotel having builtup area between 1000-2000sqm and show room above 1000 sqmMNC Show Room, Restaurants, Industries & Factory",
				"C- Other Hotels, Bars, Restaurant, Banks, ATMs, Show Rooms, Cell Centre, Marriage Hall, Travel Agency, Mobile Tower, Coaching Centre, Shops.",
				"C. Other hotels, Bars, Restaurant, Banks, ATM,Show Room, Call Centre, Marrige hall, Travel Agency, Mobile tower, Coaching centre, Shops",
				"COMMERCIAAL", "commercial", "Commercial", "COMMERCIAL", "Commercial Let Out", "Commercial Self",
				"Commerial",
				"E-Godowns, Dhaba, Stall, Commercial used plot of land and other types of properties not covered under (A to D).",
				"E. Godowns, Dhaba,Stall, Commercial used plot of land and other types of properties not covered under (A to D)",
				"Godowns, Dhaba, stall and other types of properties not covered under (A to D)",
				"Godowns, Dhabas, Stall and Other types of properties not covered under (A to D)",
				"Godowns, Dhabas, Stall and Other types of Properties not covered under (A to D)",
				"Gowdowns, Dhabas, Stall and other types of properties not covered under (A to D) less then 100qm.mtr",
				"Hotel having built-up area between 1 to 300 sq.mtr and show room 1 sq.mtr.to 300 sq. mtr.",
				"Hotel having built-up area between 500 to 1000 Sq. mtr. and Show Room above 1000 Sq. Mtr.",
				"Hotel having built-up area of 300 sq. mtr, MNC shows Rooms and Restaurant.",
				"Hotel having buit-up area between 1000-2000 Sq mtr and show room above 1000 Sq mtr",
				"Hotels above built-up area of 1000 Sq.  mtr., MNC Show Rooms and Restaurant", "Let-out Commercial",
				"Non- Residential", "Non-Residential",
				"Non-Residential (Dhabas, Gowdowns, Stalls, Offices, Dharamshala, Sarai, Factory)",
				"Non-Residential (Hotels, Restaurtants, Guest House, Banks, ATMs, Parking, Telecom Tower",
				"Non-residential purpose & utility", "Non - Residential", "Non Rersidential",
				"Non Residential (A) Hotels above built-up-area of 2000Sq. mtr., MNC Show Rooms and Restaurat",
				"Non Residential (A) Hotels above Built up area of 300 Sq mtr , MNC Show Rooms and restaurant",
				"Non Residential (B) Hotel having built-up area between 100 to 300 sq. mtr. and showroom 100 sq. mtr. to 300 sq. mtr.",
				"Non Residential (C) Other hotels, bars, restaurant, banks, ATMs, show rooms, call centre, marriage hall, theatre, travel agency, mobile tower, coaching less than 100 sq. mtr.",
				"Non Residential (E) Godowns, stores, dhabas, stall and other types of properties not covered under (A to D) less than 100 sq. mtrs.",
				"Non Residential occupancy (C) Other Hotals, Bars,Restaurant, Banks, ATMs,Show Rooms, Call Centre, Marriage Hall, Travel Agency, Mobile Towers, Coaching");

		List<String> mixed = Arrays.asList("Mixed Property", "Residential  n commercial", "Residential/Commercial",
				"Self Residential and Commercial", "Let out Residential and Commercial", "Shop & Residentialt",
				"Hotel/Guest house/Rest House/ Restaurant/ Banks/ Industries/Hospital/Clinic/Hostel/Collage/School/Office",
				"Non-Residential (Shops, Colleges, Showrooms, Edu. Institution, Ropeway, Lift, Hospital)");

		List<String> institutional = Arrays.asList(
				"oaching centre",
				"educational institutions",
				"private hospitals (100-500 sq. mtrs.)",
				"private hospitals (1-99 sq. mtrs.)",
				
				"D-Schools, Colleges, Education Institutions, Offices, Hostel, Hospital, Theater, Clubs, Paying Guest House (PGs).",
				"D. School, Colleges, Education Institutions, Offices, Hostel,Hospital,Theatre, Clubs, Paying Guest (PG), Guest House",
				"Non Residential (D) Shops, school, colleges, educational institutions, offices, hotel, hospital, clubs, paying guest house(PGs), guest house less than 100 sq. mtr.",
				"Non Residential (D) Shops, School, Colleges, Eductional Institutions, Offices, Hostel, Hospital, Theatre, Clubs, Paying Guest House (PGs), Guest House",
				"office use",
				"Shop, Schools, Colleges, Education institute ,Offices, Hostel, Hospital, theatre, Clubs, paying Guest House (PGs) Guest House less then 100 sq.mtr.",
				"Shops, Hostel, Hospital, Theatre, Clubs, Paying, Guest  Houses",
				"Shops, school, collage, Education institutions, offices, hostels, hospitals, theater, clubs, paying guest house (PG's), Guest house",
				"Shops, School, Colleges, Educational Institutions, Offices, Hostel, Hospital, Theatre, Clubs, Paying Guest House (PGs) Guest House",
				"Shops, Schools, Colleges, Educational Institutions, Offices, Hostel, Hospital, Theatre, Clubs, Paying Guest House (PGs), Open Parking");

		List<String> publicSemi = Arrays.asList("Government", "tGovt-Office", "ULB",
				"govt. hospitals (100-500 sq. mtrs.)",
			    "govt. offices",
			    "	govt-office",
			    "govt. schools (1-299 sq. mtrs.)");
		List<String> industrial = Arrays.asList("factory");
		List<String> vacant = Arrays.asList("OPEN", "PLOT");
		List<String> heritage = Arrays.asList("Heritage");
		List<String> religious = Arrays.asList("Religious");
		List<String> recreational = Arrays.asList("Recreational");
		List<String> others = Arrays.asList("Cowshed/Dhara", "Let Out Property", "NU", "NULL",
				"RCC FRAME STRUCTURE AND LANTER", "Under Construction", "self parking", "");

		if (residential.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Residential";
		if (commercial.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Commercial";
		if (mixed.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Mixed Use";
		if (institutional.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Institutional";
		if (publicSemi.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Public and Semi Public";
		if (industrial.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Industrial";
		if (vacant.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Vacant land";
		if (heritage.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Heritage";
		if (religious.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Religious";
		if (recreational.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Recreational";
		if (others.stream().anyMatch(s -> s.equalsIgnoreCase(v)))
			return "Others";

		return "Others";
	}
}