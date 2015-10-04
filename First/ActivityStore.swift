//
//  ActivityStore.swift
//  First
//
//  Created by Mayank Yadav on 05/09/15.
//  Copyright © 2015 First. All rights reserved.
//

import Foundation
import HealthKit

class ActivityStore {

    let recordNameStepCount = "stepCount"
    let healthStore:HKHealthStore
    let dataStore:DataStore

    init(healthKitStore: HKHealthStore) {
        healthStore = healthKitStore;
        dataStore = DataStore()
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
        dataStore.updateRemoteRecordForKey(recordNameStepCount, key: "steps", value: stepCount)
    }

    func fetchFriends() {
        dataStore.fetchAddressbookFriends()
    }
}