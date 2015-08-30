//
//  Authentication.swift
//  First
//
//  Created by Mayank Yadav on 30/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import UIKit
import CloudKit

class Authenticator {

    class func authenticate(completionHandler: (Bool) -> Void) {

        let container = CKContainer.defaultContainer()
        container.accountStatusWithCompletionHandler { (status, error) -> Void in

            if status == CKAccountStatus.NoAccount {
                showSignIntoICloudAlert({ (complete) -> Void in
                    completionHandler(false)
                })
            } else {
                completionHandler(true)
            }
        }
    }

    class private func showSignIntoICloudAlert(completion:(Bool)->Void) {

        let actionTitle = NSLocalizedString("Okay", comment: "Okay")
        let alertController = signInICloudAlert()
        let alertAction = UIAlertAction(title: actionTitle, style: UIAlertActionStyle.Cancel) { (alertAction) -> Void in
            completion(true)
        }

        alertController.addAction(alertAction)

        let rootViewController = UIApplication.sharedApplication().keyWindow?.rootViewController
        rootViewController?.presentViewController(signInICloudAlert(), animated: true, completion: nil)
    }

    class private func signInICloudAlert() -> UIAlertController {

        let title = NSLocalizedString("Sign in to iCloud", comment: "Sign in to iCloud")
        let message = NSLocalizedString("Sign in to your iCloud account to write records. On the Home screen, launch Settings, tap iCloud, and enter your Apple ID. Turn iCloud Drive on. If you don't have an iCloud account, tap Create a new Apple ID.", comment: "iCloud Signin alert message")
        let alert = UIAlertController(title: title, message: message, preferredStyle: UIAlertControllerStyle.Alert)
        return alert
    }
}