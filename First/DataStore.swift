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

    func saveRecord(record:CKRecord) {

        let container = CKContainer.defaultContainer()
        let database = container.publicCloudDatabase

        database.saveRecord(record) { (record, error) -> Void in
            if let record = record {
                print("Printing Saved Record")
                print(record)
            }
        }
    }

    func fetchRecord(recordID:CKRecordID, completion:(CKRecord?) -> Void) {

        let container = CKContainer.defaultContainer()
        let database = container.publicCloudDatabase

        database.fetchRecordWithID(recordID) { (record, error) -> Void in
            if let record = record {
                completion(record)
            } else {
                completion(nil)
            }
        }
    }

     func fetchStepCount(completion:(Double?, NSError?) -> Void) {

        let recordID = CKRecordID(recordName: recordNameStepCount)

        fetchRecord(recordID) { (record) -> Void in
            if let record = record {
                let steps = record["steps"] as? Double ?? nil
                completion(steps, nil)
            } else {
                completion(nil, nil)
            }
        }
    }

    func updateStepCount(stepCount:Double) {

        let recordID = CKRecordID(recordName: recordNameStepCount)
        let record = CKRecord(recordType: "Activity", recordID: recordID)
        record["steps"] = stepCount
        saveRecord(record)
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