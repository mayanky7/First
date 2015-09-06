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
        let database = container.privateCloudDatabase

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
        let database = container.privateCloudDatabase

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
        print("Updating record for key \(key) value\(value)")
        saveRecord(record)
    }

    //Social
    func requestDiscoveryPermission(completion:(Bool) -> Void) {

        let container = CKContainer.defaultContainer()

        container.requestApplicationPermission(CKApplicationPermissions.UserDiscoverability) { (status, error) -> Void in

            if status == CKApplicationPermissionStatus.Granted {
                completion(true)
            } else {
                completion(false)
            }
        }
    }

    func fetchAddressbookFriends() {

        let defaultContainer = CKContainer.defaultContainer()
        let email = "mayanky7@gmail.com"

        defaultContainer.discoverUserInfoWithEmailAddress(email) { (discoveredUserInfo, error) -> Void in

            if let error = error {
                print(error)
            } else {
                print(discoveredUserInfo)
            }
        }
    }
}