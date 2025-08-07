package org.egov.user.web.controller;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.SocketException;
import java.net.URLEncoder;
import java.net.UnknownHostException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.imageio.ImageIO;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.bind.ValidationException;
import javax.xml.parsers.ParserConfigurationException;

import org.egov.user.domain.service.utils.BisagNSAMLUtil;
import org.egov.user.web.contract.BisagNSAMLResponse;
//import org.hibernate.query.Query;
import org.opensaml.saml2.core.LogoutRequest;
import org.opensaml.saml2.core.LogoutResponse;
import org.opensaml.saml2.core.impl.LogoutRequestMarshaller;
import org.opensaml.saml2.core.impl.LogoutResponseMarshaller;
import org.opensaml.xml.io.UnmarshallingException;
import org.opensaml.xml.util.XMLHelper;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.session.SessionAuthenticationException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

//import com.BisagN.IAM.BisagNSAMLResponse;
//import com.BisagN.IAM.BisagNSAMLUtil;
//import com.BisagN.IAM.SessionContext;
//import com.BisagN.IAM.User;
//import com.BisagN.IAM.UserContext;
//import com.BisagN.IAM.XmlFormater;
//import com.controller.common.CommonController;
//import com.dao.JLA.about_academyDao;
//import com.dao.login.RoleBaseMenuDAO;
//import com.dao.login.UserLoginDAO;
//import com.dao.login.UserLoginDAOImpl;
//import com.itextpdf.text.pdf.codec.Base64.InputStream;
//import com.models.Role;
//import com.models.TB_LDAP_MODULE_MASTER;
//import com.models.TB_LDAP_SCREEN_MASTER;
//import com.models.TB_LDAP_SUBMODULE_MASTER;
//import com.models.UserLogin;
//import com.models.Helpdesk.HD_TB_BISAG_USER_LOGIN_COUNT_INFO;
//import com.persistance.util.HibernateUtil;
import java.security.cert.Certificate;

@Controller
public class LoginController {

	private static final String IAM_URL = "https://iam4.army.mil";
	private static final String ENTITY_ID = "JLAtestEntityId";
	private static final String APP_URL = "http://localhost:8080";
	private static final String APP_LOGOUT_PATH = "logout";

	@RequestMapping(value = { "/", "/login" }, method = { RequestMethod.GET, RequestMethod.POST })
	public ModelAndView login(@RequestParam(value = "SAMLResponse", required = false) String SAMLResponse,
			HttpServletRequest request, HttpServletResponse response, HttpSession session, ModelMap Mmap)
			throws InvalidKeySpecException, NoSuchAlgorithmException, CertificateException, IOException,
			ParserConfigurationException, SAXException, UnmarshallingException,
			org.opensaml.xml.validation.ValidationException, ValidationException {

		// Encrypted SAML Response
		String responseMessage = request.getParameter("SAMLResponse");
		responseMessage = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHNhbWwycDpSZXNwb25zZSBEZXN0aW5hdGlvbj0iaHR0cHM6Ly9pYW00LmFybXkubWlsL0lBTS9zZWxmc2VydmljZS1kYXNoYm9hcmQuaHRtIiBJRD0iZW1JQU0iIEluUmVzcG9uc2VUbz0iU2VsZlNlcnZpY2VFbnRpdHlJZDAxIiBJc3N1ZUluc3RhbnQ9IjIwMjMtMDMtMDZUMDc6NTA6MjAuNDQ5WiIgVmVyc2lvbj0iMi4wIiB4bWxuczpzYW1sMnA9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpwcm90b2NvbCI+PHNhbWwycDpTdGF0dXM+PHNhbWwycDpTdGF0dXNDb2RlIFZhbHVlPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6c3RhdHVzOlN1Y2Nlc3MiLz48c2FtbDJwOlN0YXR1c01lc3NhZ2U+YWNjZXNzR3JhbnRlZDwvc2FtbDJwOlN0YXR1c01lc3NhZ2U+PC9zYW1sMnA6U3RhdHVzPjxzYW1sMjpBc3NlcnRpb24gSUQ9IlB1N3ZrSHFxeUxoZUMwb0pobS1mZHNsUnh2eU9UYWpkZm1zMk1OUUpmaDgiIElzc3VlSW5zdGFudD0iMjAyMy0wMy0wNlQwNzo1MDoyMC40NDlaIiBWZXJzaW9uPSIyLjAiIHhtbG5zOnNhbWwyPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6YXNzZXJ0aW9uIj48c2FtbDI6U3ViamVjdD48c2FtbDI6TmFtZUlEIEZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOm5hbWVpZC1mb3JtYXQ6cGVyc2lzdGVudCI+aWFtX2pjb2ljPC9zYW1sMjpOYW1lSUQ+PHNhbWwyOlN1YmplY3RDb25maXJtYXRpb24gTWV0aG9kPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6Y206YmVhcmVyIj48c2FtbDI6U3ViamVjdENvbmZpcm1hdGlvbkRhdGEgSW5SZXNwb25zZVRvPSJTZWxmU2VydmljZUVudGl0eUlkMDEiIE5vdE9uT3JBZnRlcj0iMjAyMy0wMy0wNlQwODowNToyMC40NDlaIiBSZWNpcGllbnQ9Imh0dHBzOi8vaWFtNC5hcm15Lm1pbC9JQU0vc2VsZi1zZXJ2aWNlLWxvZ2luLmh0bSIvPjwvc2FtbDI6U3ViamVjdENvbmZpcm1hdGlvbj48L3NhbWwyOlN1YmplY3Q+PHNhbWwyOkNvbmRpdGlvbnMgTm90QmVmb3JlPSIyMDIzLTAzLTA2VDA3OjUwOjIwLjQ0OVoiIE5vdE9uT3JBZnRlcj0iMjAyMy0wMy0wNlQwODowNToyMC40NDlaIj48c2FtbDI6QXVkaWVuY2VSZXN0cmljdGlvbj48c2FtbDI6QXVkaWVuY2U+U2VsZlNlcnZpY2VFbnRpdHlJZDAxPC9zYW1sMjpBdWRpZW5jZT48L3NhbWwyOkF1ZGllbmNlUmVzdHJpY3Rpb24+PC9zYW1sMjpDb25kaXRpb25zPjxzYW1sMjpBdXRoblN0YXRlbWVudCBBdXRobkluc3RhbnQ9IjIwMjMtMDMtMDZUMDc6NTA6MjAuNDQ5WiIgU2Vzc2lvbkluZGV4PSJQdTd2a0hxcXlMaGVDMG9KaG0tZmRzbFJ4dnlPVGFqZGZtczJNTlFKZmg4IiBTZXNzaW9uTm90T25PckFmdGVyPSIyMDIzLTAzLTA2VDA4OjA1OjIwLjQ0OVoiPjxzYW1sMjpBdXRobkNvbnRleHQ+PHNhbWwyOkF1dGhuQ29udGV4dENsYXNzUmVmLz48L3NhbWwyOkF1dGhuQ29udGV4dD48L3NhbWwyOkF1dGhuU3RhdGVtZW50PjxzYW1sMjpBdHRyaWJ1dGVTdGF0ZW1lbnQ+PHNhbWwyOkF0dHJpYnV0ZSBOYW1lPSJhcHBfbmFtZSIgTmFtZUZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmF0dHJuYW1lLWZvcm1hdDpiYXNpYyI+PHNhbWwyOkF0dHJpYnV0ZVZhbHVlIHhtbG5zOnhzPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYSIgeG1sbnM6eHNpPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZSIgeHNpOnR5cGU9InhzOnN0cmluZyI+U2VsZlNlcnZpY2U8L3NhbWwyOkF0dHJpYnV0ZVZhbHVlPjwvc2FtbDI6QXR0cmlidXRlPjxzYW1sMjpBdHRyaWJ1dGUgTmFtZT0iYWNjZXNzX21vZGUiIE5hbWVGb3JtYXQ9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphdHRybmFtZS1mb3JtYXQ6YmFzaWMiPjxzYW1sMjpBdHRyaWJ1dGVWYWx1ZSB4bWxuczp4cz0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiIHhtbG5zOnhzaT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEtaW5zdGFuY2UiIHhzaTp0eXBlPSJ4czpzdHJpbmciPmJvdGg8L3NhbWwyOkF0dHJpYnV0ZVZhbHVlPjwvc2FtbDI6QXR0cmlidXRlPjxzYW1sMjpBdHRyaWJ1dGUgTmFtZT0idXNlcl9uYW1lIiBOYW1lRm9ybWF0PSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6YXR0cm5hbWUtZm9ybWF0OmJhc2ljIj48c2FtbDI6QXR0cmlidXRlVmFsdWUgeG1sbnM6eHM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hIiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4c2k6dHlwZT0ieHM6c3RyaW5nIj5pYW1famNvaWM8L3NhbWwyOkF0dHJpYnV0ZVZhbHVlPjwvc2FtbDI6QXR0cmlidXRlPjxzYW1sMjpBdHRyaWJ1dGUgTmFtZT0iQXBwbGljYXRpb25fUm9sZSIgTmFtZUZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmF0dHJuYW1lLWZvcm1hdDpiYXNpYyI+PHNhbWwyOkF0dHJpYnV0ZVZhbHVlIHhtbG5zOnhzPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYSIgeG1sbnM6eHNpPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1pbnN0YW5jZSIgeHNpOnR5cGU9InhzOnN0cmluZyI+VXNlcjwvc2FtbDI6QXR0cmlidXRlVmFsdWU+PC9zYW1sMjpBdHRyaWJ1dGU+PC9zYW1sMjpBdHRyaWJ1dGVTdGF0ZW1lbnQ+PC9zYW1sMjpBc3NlcnRpb24+PC9zYW1sMnA6UmVzcG9uc2U+";

		System.out.println("responseMessage : " + responseMessage);
		// Preventing direct access of app -- app can only be access through IAM
		// when app is directly accessed responseMessage will be null
		if (responseMessage == null || responseMessage.equalsIgnoreCase(null)) {
			response.sendRedirect(IAM_URL + "/IAM/User");
		} else {
			try {
				System.out.println("responseMessage : " + responseMessage);
				// Validate SAML Response and extract appt and role
				BisagNSAMLResponse res = BisagNSAMLUtil.validateSAML(responseMessage);
				System.err.println(res);
				if (res.isHasSignValidated()) {
					String idmappt = res.getAppt();
					String idmrole = res.getRole();
//					User user = roleBaseDAO.verifyRoleAndAppt(idmappt, idmrole);
//					if (user.getUserID() != 0) {
//						System.out.println("verified idmappt :: " + idmappt + ", idmrole :: " + idmrole);
//						setSessionDetails(request, user);
//						response.sendRedirect("admin/commonDashboard");
//					} else {
//						System.out.println(
//								"unable to fetch user details idmappt :: " + idmappt + ", idmrole :: " + idmrole);
//						session.invalidate();
//						response.sendRedirect(IAM_URL + "/IAM/User");
//					}
				} else {
					System.out.println("unable to verify saml signature idmappt :: " + res.getAppt() + ", idmrole :: "
							+ res.getRole());
//					session.invalidate();
//					response.sendRedirect(IAM_URL + "/IAM/User");
				}
			} catch (Exception e) {
				System.out.println("Exception " + e);
				session.invalidate();
				response.sendRedirect(IAM_URL + "/IAM/User");
			}
		}
		return new ModelAndView("appLogoutTiles");
	}

//	public void setSessionDetails(HttpServletRequest request, User user) throws IOException {
//
//		// User Login Status
//		Session session1 = HibernateUtil.getSessionFactory().openSession();
//		Transaction tx = session1.beginTransaction();
//		try {
//			String ip = getClientIp(request);
//			String server = getServerIP();
//			user.setServer(server);
//
//			HD_TB_BISAG_USER_LOGIN_COUNT_INFO userlogin = new HD_TB_BISAG_USER_LOGIN_COUNT_INFO();
//			userlogin.setLoginstatus("Active");
//			userlogin.setStatus("1");
//			userlogin.setUserid(user.getUserID());
//			// userlogin.setIdm_appt(user.getUserName());
//			// userlogin.setIdm_role(user.getRole());
//			// userlogin.setClient_ip(ip);
//			session1.save(userlogin);
//			tx.commit();
//
//			/*
//			 * UserContext uc = new UserContext(request.getSession(true).getId());
//			 * uc.setUserID(user.getUserID()); uc.setUserName(user.getUserName());
//			 * uc.setRoleID(user.getRoleID()); uc.setRole(user.getRole());
//			 * uc.setRoleAccess(user.getRoleAccess()); uc.setServer(user.getServer());
//			 * 
//			 * SessionContext sc = new SessionContext(); sc.putSession(request, uc,
//			 * "USER_CONTEXT");
//			 */
//
//			int userId = userLoginDAO.getUserId(user.getUserName());
//			Role roleList = userLoginDAO.findRole_url(user.getRole());
//
//			request.getSession().setAttribute("userId_for_jnlp", userId);
//			request.getSession().setAttribute("username", user.getUserName());
//			request.getSession().setAttribute("newtoken", "");
//
//			String RoleUrl = "";
//			if (roleList.getRole_url() != null) {
//				RoleUrl = roleList.getRole_url();
//			}
//			String RoleType = "";
//			if (roleList.getRole_type() != null) {
//				RoleType = roleList.getRole_type();
//			}
//			String Acces_lvl = "";
//			if (roleList.getAccess_lvl() != null) {
//				Acces_lvl = roleList.getAccess_lvl();
//			}
//			String subAcces_lvl = "";
//			if (roleList.getSub_access_lvl() != null) {
//				subAcces_lvl = roleList.getSub_access_lvl();
//			}
//
//			String staff_lvl = "";
//			if (roleList.getStaff_lvl() != null) {
//				staff_lvl = roleList.getStaff_lvl();
//			}
//
//			request.getSession().setAttribute("roleSusNo", "");
//			request.getSession().setAttribute("roleUrl", RoleUrl);
//			request.getSession().setAttribute("roleType", RoleType);
//			request.getSession().setAttribute("roleAccess", Acces_lvl);
//			request.getSession().setAttribute("roleSubAccess", subAcces_lvl);
//			request.getSession().setAttribute("roleStaff_lvl", staff_lvl);
//
//			int roleid = roleList.getRoleId();
//			UserLogin addData = userLoginDAO.findByRoleId(userId);
//			request.getSession().setAttribute("army_no", addData.getArmy_no());
//			if (roleid != 0) {
//				request.getSession().setAttribute("roleid", roleid);
//			}
//			request.getSession().setAttribute("successValue", "Fail");
//
//			String login_name = "";
//			if (addData.getLogin_name() != null) {
//				login_name = addData.getLogin_name();
//			}
//
//			request.getSession().setAttribute("userId", userId);
//			request.getSession().setAttribute("username", addData.getUserName());
//			request.getSession().setAttribute("army_no", addData.getArmy_no());
//			if (roleid != 0) {
//				request.getSession().setAttribute("roleid", roleid);
//			}
//			request.getSession().setAttribute("roleloginName", login_name);
//			//////////////////
//
//			// System.out.println("success 1" + role1);
//
//			// String ip = getClientIp(request);
//			request.getSession().setAttribute("ip", ip);
//
//			String userAgent = request.getHeader("User-Agent");
//			request.getSession().setAttribute("user_agentWithIp", userAgent + "_" + ip);
//			request.getSession().setAttribute("user_agent", userAgent);
//
//			// request.getSession().setAttribute("otpKey", "commonPwdEncKeys");
//			request.getSession().setAttribute("KeySpec", "dc0da04af8fee58593442bf834b30739");
//
//			final long fileSizeLimit = 8 * 1024 * 100;
//			request.getSession().setAttribute("fileSizeLimit", fileSizeLimit);
//
//			String curDate = new SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(new Date());
//			request.getSession().setAttribute("curDate", curDate);
//
//			request.getSession().setAttribute("regScript", "^[a-zA-Z0-9\\\\[\\\\] \\\\+ \\\\*-., \\\\/ ~!@#$^&%_]+$");
//
//			request.getSession().setAttribute("helpdeskFilePath", "/srv" + File.separator + "HELP");
//			request.getSession().setAttribute("handingTakingOverPath", "/srv" + File.separator + "handingTakingOver");
//			request.getSession().setAttribute("new_pdf_path", "/srv" + File.separator + "new_pdf_path");
//			request.getSession().setAttribute("Resultupload", "/srv" + File.separator + "Resultupload");
//			request.getSession().setAttribute("fwo_path", "/srv" + File.separator + "fwo_path");
//
//			request.getSession().setAttribute("Comdlist", comstr.getcommandantDetails());
//			// request.getSession().setAttribute("JB","I am Jay Bhavsar");
//			// kevalpatel
//
//			List<TB_LDAP_MODULE_MASTER> module = userLoginDAO.getModulelist(roleid);
//			String menu = "";
//
//			if (!RoleUrl.equals("")) {
//				menu = "<li><a href='" + RoleUrl + "' class='btn btn-danger btn-sm'>Dashboard</a></li>";
//			}
//
//			for (int mod = 0; mod < module.size(); mod++) {
//				System.out.println("module name == " + module.get(mod).getModule_name());
//				menu += "<li class='nav-item dropdown dropdown-item show' id='" + module.get(mod).getModule_name()
//						+ "_menu'>";
//				menu += "<a class='nav-link dropdown-toggle' href='#' id='Dropdown_" + module.get(mod).getModule_name()
//						+ "' role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><i class='fa-arrow-circle-right'></i>"
//						+ module.get(mod).getModule_name() + "</a>";
//				menu += "<ul class='dropdown-menu show arrow' aria-labelledby='Dropdown_"
//						+ module.get(mod).getModule_name() + "' >";
//				List<TB_LDAP_SUBMODULE_MASTER> submodule = userLoginDAO.getSubModulelist(module.get(mod).getId(),
//						roleid);
//				for (int submod = 0; submod < submodule.size(); submod++) {
//					menu += "<li class='dropdown-item dropdown create_search' >";
//					menu += "<a class='dropdown-toggle' id='Dropdown_" + submodule.get(submod).getId()
//							+ "' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false' onclick='getsubmodule("
//							+ submodule.get(submod).getId() + ")'><i class='fa fa-plus-circle'></i>"
//							+ submodule.get(submod).getSubmodule_name() + "</a>";
//					menu += "<ul class='dropdown-menu scrollbar' aria-labelledby='Dropdown_"
//							+ submodule.get(submod).getId() + "' id='Dropdown_" + submodule.get(submod).getId()
//							+ "' style='height: 100%;'>";
//					List<TB_LDAP_SCREEN_MASTER> screen = userLoginDAO.getScreenlist(module.get(mod).getId(),
//							submodule.get(submod).getId(), roleid);
//					for (int scr = 0; scr < screen.size(); scr++) {
//						menu += "<li class='dropdown-item'><a href='" + screen.get(scr).getScreen_url()
//								+ "' onclick='localStorage.Abandon();'> <i class='fa fa-arrow-circle-o-right'></i>"
//								+ screen.get(scr).getScreen_name() + "</a></li>";
//					}
//					menu += "</ul>";
//					menu += "</li>";
//				}
//				menu += "</ul>";
//				menu += "</li>";
//			}
//			request.getSession().setAttribute("menu", menu);
//
//			// request.getSession().setAttribute("respUrl", respUrl);
//
//			/*
//			 * request.getSession().setAttribute("userId", user.getUserId());
//			 * request.getSession().setAttribute("username", user.getUserName());
//			 * request.getSession().setAttribute("roleid", user.getRoleId());
//			 * request.getSession().setAttribute("role", user.getRole());
//			 * request.getSession().setAttribute("roleUrl", user.getRoleUrl());
//			 * request.getSession().setAttribute("roleType", user.getRoleType());
//			 * request.getSession().setAttribute("roleAccess", user.getRoleAccessLevel());
//			 * request.getSession().setAttribute("roleSubAccess",
//			 * user.getRoleSubAccessLevel());
//			 * request.getSession().setAttribute("roleStaff_lvl",
//			 * user.getRoleStaffAccessLevel()); request.getSession().setAttribute("server",
//			 * server);
//			 * 
//			 * request.getSession().setAttribute("roleSusNo", user.getSusNo());
//			 * request.getSession().setAttribute("roleArmCode", user.getArmCode());
//			 * request.getSession().setAttribute("roleFormationNo", user.getFormation());
//			 * request.getSession().setAttribute("roleloginName", user.getLoginName());
//			 * 
//			 * request.getSession().setAttribute("IDMAppt", user.getUserName());
//			 * request.getSession().setAttribute("IDMRole", user.getRole());
//			 * request.getSession().setAttribute("army_no", user.getArmyNo());
//			 * request.getSession().setAttribute("successValue", "BISAGN");
//			 * 
//			 * request.getSession().setAttribute("ip", ip); String userAgent =
//			 * request.getHeader("User-Agent");
//			 * request.getSession().setAttribute("user_agentWithIp", userAgent + "_" + ip);
//			 * request.getSession().setAttribute("user_agent", userAgent);
//			 * request.getSession().setAttribute("KeySpec",
//			 * "dc0da04af8fee58593442bf834b30739");
//			 * 
//			 * final long fileSizeLimit = 2 * 1024 * 1024;
//			 * request.getSession().setAttribute("fileSizeLimit", fileSizeLimit);
//			 * request.getSession().setAttribute("helpdeskFilePath", "/srv" + File.separator
//			 * + "HELP"); request.getSession().setAttribute("formationFilePath", "/srv" +
//			 * File.separator + "Upload_DocumentsFRM");
//			 * request.getSession().setAttribute("handingTakingOverPath", "/srv" +
//			 * File.separator + "handingTakingOver"); Boolean medical = false; if
//			 * (user.getRoleAccessLevel().equals("Unit")) { String sus_no = user.getSusNo();
//			 * } else if (user.getRoleAccessLevel().equals("MISO") &&
//			 * user.getRoleSubAccessLevel().equals("Medical")) { medical = true; } else if
//			 * (user.getRoleAccessLevel().equals("DG") &&
//			 * user.getRoleSubAccessLevel().equals("Medical")) { medical = true; } else if
//			 * (user.getRoleAccessLevel().equals("Formation")) { medical = true; }
//			 * List<TB_LDAP_MODULE_MASTER> module =
//			 * userLoginDAO.getModulelist(user.getRoleId(), medical); String menu = "";
//			 * 
//			 * if (!user.getRoleUrl().equals("")) {
//			 * 
//			 * if (!user.getRole().toUpperCase().contains("FP")) { menu = "<li><a href='" +
//			 * user.getRoleUrl() +
//			 * "' class='btn btn-danger btn-sm'><i class='fa fa-dashboard'></i> Dashboard</a></li>"
//			 * ; } }
//			 * 
//			 * if (!user.getRole().equals("hq")) {
//			 * 
//			 * menu = ""; for (int mod = 0; mod < module.size(); mod++) {
//			 * List<TB_LDAP_SUBMODULE_MASTER> submodule =
//			 * userLoginDAO.getSubModulelist(module.get(mod).getId(), user.getRoleId()); for
//			 * (int submod = 0; submod < submodule.size(); submod++) { menu +=
//			 * "<div class='nnDropDown'><button id='Dropdown_" +
//			 * submodule.get(submod).getId() + "' class='nnDropBtn'>" +
//			 * submodule.get(submod).getSubmodule_name().toUpperCase() +
//			 * "&nbsp;<i class='fa fa-arrow-down'></i></button>"; menu +=
//			 * "<div class='nnDropDown-content'>";
//			 * 
//			 * List<TB_LDAP_SCREEN_MASTER> screen =
//			 * userLoginDAO.getScreenlist(module.get(mod).getId(),
//			 * submodule.get(submod).getId(), user.getRoleId()); for (int scr = 0; scr <
//			 * screen.size(); scr++) { menu += "<a id='Dropdown_" +
//			 * screen.get(scr).getScreen_url() + "' href='" +
//			 * screen.get(scr).getScreen_url() + "'>" +
//			 * screen.get(scr).getScreen_name().toUpperCase() + "</a>"; } menu += "</div>";
//			 * menu += "</div>"; } } } else { List<TB_LDAP_SCREEN_MASTER> screen =
//			 * userLoginDAO.getScreenlistHQ(user.getRoleId()); for (int scr = 0; scr <
//			 * screen.size(); scr++) { menu +=
//			 * "<li class='dropdown-item'><i class='fa fa-arrow-circle-o-right'></i><a href='"
//			 * + screen.get(scr).getScreen_url() + "' onclick='localStorage.Abandon();'> " +
//			 * screen.get(scr).getScreen_name().toUpperCase() + "</a></li>"; } }
//			 * request.getSession().setAttribute("menu", menu);
//			 * 
//			 * String layout = ""; List<String> msg = userLoginDAO.getLayoutlist(); layout
//			 * += "<h3>"; for (int m = 0; m < msg.size(); m++) { if (m == 0) { layout +=
//			 * msg.get(m); } else { layout += " | " + msg.get(m); } } layout += "</h3>";
//			 * request.getSession().setAttribute("layout", layout);
//			 */
//
//		} catch (Exception e) {
//			System.out.println("Exception Logged User :" + e.getMessage());
//			tx.rollback();
//		} finally {
//			session1.close();
//		}
//	}

}
