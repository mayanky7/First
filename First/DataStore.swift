//
//  DataStore.swift
//  First
//
//  Created by Mayank Yadav on 29/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import UIKit
import CloudKit
import HealthKit

class DataStore {

    let recordNameStepCount = "stepCount"
    let healthStore:HKHealthStore;

    init(healthKitStore: HKHealthStore) {
        healthStore = healthKitStore;
    }

    func updateStepCount(stepCount:Double) {

        let recordID = CKRecordID(recordName: recordNameStepCount)
        let activityRecord = CKRecord(recordType: "Activity", recordID: recordID)
        activityRecord["steps"] = stepCount

        let container = CKContainer.defaultContainer()
        let database = container.publicCloudDatabase

        database.saveRecord(activityRecord) { (record, error) -> Void in
            if let record = record {
                print("Printing Saved Record")
                print(record)
            }
        }
    }

     func fetchStepCount(completion:(Double?, NSError?) -> Void) {

        let container = CKContainer.defaultContainer()
        let database = container.publicCloudDatabase

        let recordID = CKRecordID(recordName: recordNameStepCount)
        database.fetchRecordWithID(recordID) { (record, error) -> Void in

            if let record = record {
                let steps = record["steps"] as? Double ?? nil
                print("Fetching iCloud steps")
                completion(steps, nil)
            } else {
                self.fetchLocalStepCount(completion)
            }
        }
    }

     func fetchLocalStepCount(completion:(Double?, NSError?) -> Void) {

        let dataTypes = self.healthStore.dataTypesToRead();
        self.healthStore.requestAuthorizationToShareTypes(Set(), readTypes: dataTypes)
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
}