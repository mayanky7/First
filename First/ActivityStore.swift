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

        dataStore.fetchRecord(recordNameStepCount) { (record) -> Void in
            if let record = record {
                let steps = record["steps"] as? Double ?? nil
                print("Fetched step count from iCloud")
                completion(steps, nil)
            } else {
                self.fetchLocalStepCount({ (stepCount, error) -> Void in
                    if let stepCount = stepCount {
                        print("Fetching local step count")
                        completion(stepCount, nil)
                    } else {
                        completion(nil, error)
                    }
                })
            }
        }
    }

    func fetchLocalStepCount(completion:(Double?, NSError?) -> Void) {

        self.healthStore.fetchTodayStepCount({ (stepCount, error) -> Void in
            print("Fetching local steps")
            self.updateStepCount(stepCount)
            completion(stepCount, error)
        })
    }

    func updateStepCount(stepCount:Double) {
        dataStore.updateRecordForKey(recordNameStepCount, key: "steps", value: stepCount)
    }

    func fetchFriends() {
        dataStore.fetchAddressbookFriends()
    }
}