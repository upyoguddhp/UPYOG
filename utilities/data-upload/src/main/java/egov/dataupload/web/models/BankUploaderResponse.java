package egov.dataupload.web.models;

import java.util.List;

import egov.dataupload.models.BankUploadModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class BankUploaderResponse {
	
	List<BankUploadModel> bankExcelUploadLst;

}
