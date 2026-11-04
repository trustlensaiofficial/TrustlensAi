package com.trustlensai.android

import android.app.Application
import com.trustlensai.android.core.consent.ConsentStore
import com.trustlensai.android.core.net.NetworkModule
import com.trustlensai.android.core.net.TrustLensApi
import com.trustlensai.android.core.session.SessionManager

/**
 * Manual wiring, on purpose.
 *
 * This app has three long-lived objects. A dependency-injection framework
 * would add a build step, a compiler plugin and a layer of indirection to
 * manage three singletons, which is the kind of architecture that looks
 * advanced and costs more than it returns.
 */
class TrustLensApplication : Application() {

    val api: TrustLensApi by lazy { NetworkModule.api() }
    val consent: ConsentStore by lazy { ConsentStore(this) }
    val session: SessionManager by lazy { SessionManager(this) }

    override fun onCreate() {
        super.onCreate()
        // Restoring here rather than in a screen means the first frame already
        // knows whether there is a session, so sign-in never flashes for
        // someone who is already signed in.
        session.restore()
    }
}
