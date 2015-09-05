//
//  DataStore.swift
//  First
//
//  Created by Mayank Yadav on 29/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import CloudKit

class DataStore {

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

    func fetchRecord(recordName:String, completion:(CKRecord?) -> Void) {

        let recordID = CKRecordID(recordName: recordName)
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

    func updateRecordForKey(recordName:String, key:String, value:Double) {
        let recordID = CKRecordID(recordName: recordName)
        let record = CKRecord(recordType: "Activity", recordID: recordID)
        record[key] = value
        saveRecord(record)
    }
}