package org.egov.user.security;

import java.util.Arrays;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.OAuth2RefreshToken;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.security.oauth2.provider.token.TokenStore;

/**
 * Enforces a single active session per user: when a user authenticates, every token previously
 * issued to that user for the same client is revoked, so a second login (another browser/device)
 * signs the first one out. Accounts listed in {@code exemptUsernames} (e.g. shared service accounts
 * used by the frontends) keep the default behaviour.
 */
public class SingleSessionTokenServices extends DefaultTokenServices {

    private final TokenStore store;
    private final boolean enabled;
    private final Set<String> exemptUsernames;

    public SingleSessionTokenServices(TokenStore store, boolean enabled, String exemptUsernames) {
        this.store = store;
        this.enabled = enabled;
        this.exemptUsernames = Arrays.stream(exemptUsernames.split(","))
                .map(String::trim).filter(u -> !u.isEmpty()).collect(Collectors.toSet());
        setTokenStore(store);
    }

    @Override
    public OAuth2AccessToken createAccessToken(OAuth2Authentication authentication) {
        if (enabled && !authentication.isClientOnly() && !exemptUsernames.contains(authentication.getName())) {
            Collection<OAuth2AccessToken> existing = store.findTokensByClientIdAndUserName(
                    authentication.getOAuth2Request().getClientId(), authentication.getName());
            for (OAuth2AccessToken token : existing) {
                OAuth2RefreshToken refresh = token.getRefreshToken();
                store.removeAccessToken(token);
                if (refresh != null) {
                    store.removeRefreshToken(refresh);
                }
            }
        }
        return super.createAccessToken(authentication);
    }
}
