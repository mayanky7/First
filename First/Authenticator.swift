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
                completionHandler(false)
            } else {
                completionHandler(true)
            }
        }
    }
}