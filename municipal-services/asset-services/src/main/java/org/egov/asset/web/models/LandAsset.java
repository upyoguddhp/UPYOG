package org.egov.asset.web.models;

<<<<<<< HEAD
public class LandAsset extends Asset{
	private LandInfo landInfo;

	public LandAsset(String type, LandInfo landInfo) {
=======
public class LandAsset extends Asset {
    private LandInfo landInfo;

    public LandAsset(String type, LandInfo landInfo) {
>>>>>>> niua-upstream/niua-dev-2.0
        super(type, landInfo);
        this.landInfo = landInfo;
    }

    public LandInfo getLandInfo() {
<<<<<<< HEAD
    	this.landInfo = (LandInfo) super.getAdditionalDetails();
=======
        this.landInfo = (LandInfo) super.getAdditionalDetails();
>>>>>>> niua-upstream/niua-dev-2.0
        return landInfo;
    }

}
