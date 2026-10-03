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
package org.egov.egf.web.controller.voucher;

import java.util.Date;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import org.egov.commons.CVoucherHeader;
import org.egov.egf.utils.FinancialUtils;
import org.egov.egf.voucher.service.JournalVoucherService;
import org.egov.eis.web.contract.WorkflowContainer;
import org.egov.infra.admin.master.service.AppConfigValueService;
import org.egov.infra.validation.exception.ValidationException;
import org.egov.utils.FinancialConstants;
import org.hibernate.validator.constraints.SafeHtml;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author venki
 *
 */

@Controller
@RequestMapping(value = "/journalvoucher")
@Validated
public class CreateJournalVoucherController extends BaseVoucherController {

    private static final String JOURNALVOUCHER_FORM = "journalvoucher-form";

    private static final String VOUCHER_NUMBER_GENERATION_AUTO = "voucherNumberGenerationAuto";

    private static final String STATE_TYPE = "stateType";

    private static final String APPROVAL_POSITION = "approvalPosition";
    
    

    @Autowired
    private JournalVoucherService journalVoucherService;

    @Autowired
    private FinancialUtils financialUtils;
    
    private static final Logger log = LoggerFactory.getLogger(CreateJournalVoucherController.class);

    public CreateJournalVoucherController(final AppConfigValueService appConfigValuesService) {
        super(appConfigValuesService);
    }
    
    @InitBinder
    public void initBinder(WebDataBinder binder) {
    	binder.setDisallowedFields("id");
    }

    @Override
    protected void setDropDownValues(final Model model) {
        super.setDropDownValues(model);
        model.addAttribute("voucherSubTypes", FinancialUtils.VOUCHER_SUBTYPES);
    }

    @GetMapping(value = "/newform")
    public String showNewForm(@ModelAttribute("voucherHeader") final CVoucherHeader voucherHeader, final Model model,final HttpServletRequest request) {
        voucherHeader.setType(FinancialConstants.STANDARD_VOUCHER_TYPE_JOURNAL);
        setDropDownValues(model);
        model.addAttribute(STATE_TYPE, voucherHeader.getClass().getSimpleName());
        prepareWorkflow(model, voucherHeader, new WorkflowContainer());
        prepareValidActionListByCutOffDate(model);
        voucherHeader.setVoucherDate(new Date());
        model.addAttribute(VOUCHER_NUMBER_GENERATION_AUTO, isVoucherNumberGenerationAuto(voucherHeader, model));
        return JOURNALVOUCHER_FORM;
    }

    @PostMapping(value = "/create")
    public String create(@Valid @ModelAttribute("voucherHeader") final CVoucherHeader voucherHeader,
            final Model model,
            final BindingResult resultBinder,
            final HttpServletRequest request,
            @RequestParam @SafeHtml final String workFlowAction) {

        log.info("1. Journal Voucher create request received");
        log.info("2. VoucherHeader received: {}", voucherHeader);
        log.info("3. WorkFlowAction received: {}", workFlowAction);

        voucherHeader.setType(FinancialConstants.STANDARD_VOUCHER_TYPE_JOURNAL);
        voucherHeader.setEffectiveDate(voucherHeader.getVoucherDate());

        log.info("4. Voucher type and effective date set");

        populateVoucherName(voucherHeader);

        log.info("5. Voucher name populated: {}", voucherHeader.getName());

        populateAccountDetails(voucherHeader);

        log.info("6. Account details populated");

        if (resultBinder.hasErrors()) {

            log.warn("7. Journal Voucher validation failed. Number of errors: {}",
                    resultBinder.getErrorCount());

            setDropDownValues(model);

            model.addAttribute(STATE_TYPE, voucherHeader.getClass().getSimpleName());

            prepareWorkflow(model, voucherHeader, new WorkflowContainer());

            prepareValidActionListByCutOffDate(model);

            voucherHeader.setVoucherDate(new Date());

            model.addAttribute(
                    VOUCHER_NUMBER_GENERATION_AUTO,
                    isVoucherNumberGenerationAuto(voucherHeader, model)
            );

            log.info("8. Returning to Journal Voucher form due to validation errors");

            return JOURNALVOUCHER_FORM;

        } else {

            log.info("7. Journal Voucher validation successful");

            Long approvalPosition = 0l;
            String approvalComment = "";

            if (request.getParameter("approvalComment") != null)
                approvalComment = request.getParameter("approvalComent");

            if (request.getParameter(APPROVAL_POSITION) != null
                    && !request.getParameter(APPROVAL_POSITION).isEmpty())
                approvalPosition = Long.valueOf(
                        request.getParameter(APPROVAL_POSITION)
                );

            log.info("8. Approval Position: {}", approvalPosition);
            log.info("9. Approval Comment: {}", approvalComment);

            CVoucherHeader savedVoucherHeader;

            try {

                log.info("10. Calling journalVoucherService.create()");

                savedVoucherHeader = journalVoucherService.create(
                        voucherHeader,
                        approvalPosition,
                        approvalComment,
                        null,
                        workFlowAction
                );

                log.info("11. Journal Voucher created successfully. Voucher ID: {}",
                        savedVoucherHeader.getId());

                log.info("12. Voucher Number: {}",
                        savedVoucherHeader.getVoucherNumber());

            } catch (final ValidationException e) {

                log.error("ERROR at step 10: Journal Voucher creation failed due to ValidationException", e);

                setDropDownValues(model);

                model.addAttribute(STATE_TYPE, voucherHeader.getClass().getSimpleName());

                prepareWorkflow(model, voucherHeader, new WorkflowContainer());

                prepareValidActionListByCutOffDate(model);

                voucherHeader.setVoucherDate(new Date());

                model.addAttribute(
                        VOUCHER_NUMBER_GENERATION_AUTO,
                        isVoucherNumberGenerationAuto(voucherHeader, model)
                );

                resultBinder.reject("", e.getErrors().get(0).getMessage());

                log.info("13. Returning to Journal Voucher form with validation error");

                return JOURNALVOUCHER_FORM;
            }

            log.info("14. Fetching approver details");

            final String approverDetails = financialUtils.getApproverDetails(
                    workFlowAction,
                    savedVoucherHeader.getState(),
                    savedVoucherHeader.getId(),
                    approvalPosition,
                    ""
            );

            log.info("15. Approver details fetched successfully");

            log.info("16. Redirecting to Journal Voucher success page. Voucher ID: {}",
                    savedVoucherHeader.getId());

            return "redirect:/journalvoucher/success?approverDetails= "
                    + approverDetails
                    + "&voucherNumber="
                    + savedVoucherHeader.getVoucherNumber()
                    + "&workFlowAction="
                    + workFlowAction;
        }
    }

    @GetMapping(value = "/success")
    public String showSuccessPage(@RequestParam("voucherNumber") @SafeHtml final String voucherNumber, final Model model,
            final HttpServletRequest request) {
        final String workFlowAction = request.getParameter("workFlowAction");
        final String[] keyNameArray = request.getParameter("approverDetails").split(",");
        Long id = 0L;
        String approverName = "";
        String currentUserDesgn = "";
        String nextDesign = "";
        if (keyNameArray.length != 0 && keyNameArray.length > 0) {
            if (keyNameArray.length == 1)
                id = Long.parseLong(keyNameArray[0].trim());
            else if (keyNameArray.length == 3) {
                id = Long.parseLong(keyNameArray[0].trim());
                approverName = keyNameArray[1];
                currentUserDesgn = keyNameArray[2];
            } else {
                id = Long.parseLong(keyNameArray[0].trim());
                approverName = keyNameArray[1];
                currentUserDesgn = keyNameArray[2];
                nextDesign = keyNameArray[3];
            }
        }
        if (id != null)
            model.addAttribute("approverName", approverName);
        model.addAttribute("currentUserDesgn", currentUserDesgn);
        model.addAttribute("nextDesign", nextDesign);

        final CVoucherHeader voucherHeader = journalVoucherService.getByVoucherNumber(voucherNumber);

        final String message = getMessageByStatus(voucherHeader, approverName, nextDesign, workFlowAction);

        model.addAttribute("message", message);

        return "expensebill-success";
    }

    private String getMessageByStatus(final CVoucherHeader voucherHeader, final String approverName, final String nextDesign,
            final String workFlowAction) {
        String message;

        if (FinancialConstants.PREAPPROVEDVOUCHERSTATUS.equals(voucherHeader.getStatus()))
            message = messageSource.getMessage("msg.journal.voucher.create.success",
                    new String[] { voucherHeader.getVoucherNumber(), approverName, nextDesign }, null);
        else if (FinancialConstants.CREATEDVOUCHERSTATUS.equals(voucherHeader.getStatus()))
            message = messageSource.getMessage("msg.journal.voucher.approved.success",
                    new String[] { voucherHeader.getVoucherNumber() }, null);
        else if (FinancialConstants.WORKFLOW_STATE_CANCELLED.equals(workFlowAction))
            message = messageSource.getMessage("msg.journal.voucher.cancel",
                    new String[] { voucherHeader.getVoucherNumber() }, null);
        else
            message = messageSource.getMessage("msg.journal.voucher.reject",
                    new String[] { voucherHeader.getVoucherNumber(), approverName, nextDesign }, null);

        return message;
    }
}