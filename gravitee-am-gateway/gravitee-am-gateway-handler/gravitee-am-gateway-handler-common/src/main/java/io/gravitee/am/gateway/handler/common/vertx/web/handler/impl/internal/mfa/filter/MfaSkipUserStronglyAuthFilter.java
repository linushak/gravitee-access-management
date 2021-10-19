/**
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.gravitee.am.gateway.handler.common.vertx.web.handler.impl.internal.mfa.filter;

import io.gravitee.am.gateway.handler.common.vertx.web.handler.impl.internal.mfa.MfaFilterContext;

import java.util.function.Supplier;

/**
 * @author Rémi SULTAN (remi.sultan at graviteesource.com)
 * @author GraviteeSource Team
 */
public class MfaSkipUserStronglyAuthFilter extends MfaContextHolder implements Supplier<Boolean> {


    public MfaSkipUserStronglyAuthFilter(MfaFilterContext context) {
        super(context);
    }

    @Override
    public Boolean get() {
        final boolean userStronglyAuth = context.isUserStronglyAuth();
        // We need to check whether the AMFA and Device rule is false since we don't know of other MFA features passed or skipped MFA
        // However if the user is strongly auth we don't need to enforce MFA
        if (!userStronglyAuth && (
                context.isAmfaActive() && !context.isAmfaRuleTrue() ||
                (context.getRememberDeviceSettings().isActive() && !context.deviceAlreadyExists() && !context.isMfaSkipped())
        )
        ) {
            return false;
        } else if (context.isAmfaActive() && context.isAmfaRuleTrue()) {
            return true;
        }
        return !context.isStepUpActive() && (userStronglyAuth || context.isMfaSkipped());
    }
}
