//
//  ActivityStore.swift
//  First
//
//  Created by Mayank Yadav on 05/09/15.
//  Copyright © 2015 First. All rights reserved.
//

import Foundation
import HealthKit
import Contacts
import CloudKit

class ActivityStore {

    let healthStore:HKHealthStore
    let dataStore:DataStore = DataStore()

    init(healthKitStore: HKHealthStore) {
        healthStore = healthKitStore;
    }

    func fetchStepCount(completion:(Double?, NSError?) -> Void) {
        self.fetchLocalStepCount({ (stepCount, error) -> Void in
            if let stepCount = stepCount {
                dispatch_async(dispatch_get_main_queue(), { () -> Void in
                    self.updateRemoteStepCount(stepCount)
                    completion(stepCount, nil)
                })
            } else {
                dispatch_async(dispatch_get_main_queue(), { () -> Void in
                    completion(nil, error)
                })
            }
        })
    }

    func fetchLocalStepCount(completion:(Double?, NSError?) -> Void) {

        self.healthStore.fetchTodayStepCount({ (stepCount, error) -> Void in
            print("Fetching local steps")
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(stepCount, error)
            })
        })
    }

    func updateRemoteStepCount(stepCount:Double) {

        dataStore.fetchUserRecordIdentifier { (recordIdentifier, error) -> Void in
            if let recordIdentifier = recordIdentifier {
                self.dataStore.updateRemoteRecordForRecordName(recordIdentifier, key: "steps", value: stepCount)
            }
        }
    }

    func fetchFriends(completion:([Person]?) -> Void) {

        dataStore.fetchAddressbookFriends { (userInfos) -> Void in
            if let userInfos = userInfos {
                let persons = userInfos.map({ (let info) -> Person in
                    let identifier = info.userRecordID?.recordName
                    let name = info.displayContact?.givenName
                    let person = Person(userName: name!, userSteps: 20.0, userIdentifier: identifier!)
                    return person
                })

                completion(persons)
            } else {
                print("Failed to fetch user infos")
                completion(nil)
            }
        }
    }
}