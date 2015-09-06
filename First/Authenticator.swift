//
//  Authentication.swift
//  First
//
//  Created by Mayank Yadav on 30/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import CloudKit
import HealthKit

class Authenticator {

    let healthStore:HKHealthStore
    let container:CKContainer

    init() {
        healthStore = HKHealthStore()
        container = CKContainer.defaultContainer()
    }

    func requestPermissions(completion:(Bool) -> Void) {

        self.requestCloudKitPermission { (success) -> Void in
            if success {
                self.requestCloudKitDiscoveryPermission({ (success) -> Void in
                    if success {
                        self.requestHealthKitPermission({ (success) -> Void in
                            if success {
                                completion(true)
                            } else { completion(false) }
                        })
                    } else { completion(false) }
                })
            } else { completion(false) }
        }
    }

    func requestHealthKitPermission(completion:(Bool) -> Void) {

        let dataTypes = healthStore.dataTypesToRead();
        healthStore.requestAuthorizationToShareTypes(Set(), readTypes: dataTypes)
            { (Bool success, NSError error) -> Void in
                if success {
                    completion(true)
                } else {
                    print("Failed to get healthkit authorization")
                    completion(false)
                }
        }
    }

    func requestCloudKitPermission(completion:(Bool) -> Void) {

        container.accountStatusWithCompletionHandler { (status, error) -> Void in
            if status == CKAccountStatus.Available {
                completion(true)
            } else {
                print("iCloud Account does not exist")
                completion(false)
            }
        }
    }

    func requestCloudKitDiscoveryPermission(completion:(Bool)-> Void) {

        container.requestApplicationPermission(CKApplicationPermissions.UserDiscoverability) { (status, error) -> Void in

            if status == CKApplicationPermissionStatus.Granted {
                completion(true)
            } else {
                completion(false)
            }
        }
    }
}