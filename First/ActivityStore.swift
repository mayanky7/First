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
                completion(steps, nil)
            } else {
                completion(nil, nil)
            }
        }
    }

    func fetchLocalStepCount(completion:(Double?, NSError?) -> Void) {

        let dataTypes = healthStore.dataTypesToRead();
        healthStore.requestAuthorizationToShareTypes(Set(), readTypes: dataTypes)
            { (Bool success, NSError error) -> Void in
                if success {
                    self.healthStore.fetchTodayStepCount({ (stepCount, error) -> Void in
                        print("Fetching local steps")
                        self.updateStepCount(stepCount)
                        completion(stepCount, error)
                    })
                }
        }
    }

    func updateStepCount(stepCount:Double) {
        dataStore.updateRecordForKey(recordNameStepCount, key: "steps", value: stepCount)
    }
}