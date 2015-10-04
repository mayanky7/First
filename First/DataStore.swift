//
//  DataStore.swift
//  First
//
//  Created by Mayank Yadav on 29/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import CloudKit

class DataStore {

    func saveRemoteRecord(record:CKRecord) {

        let container = CKContainer.defaultContainer()
        let database = container.privateCloudDatabase

        database.saveRecord(record) { (record, error) -> Void in
            if let error = error {
                print("Error saving record \(error)")
            } else if let _ = record {
                print("Printing Saved Record, record \(record)")
            }
        }
    }

    func fetchRemoteRecord(recordName:String, completion:(CKRecord?) -> Void) {

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

    func updateRemoteRecordForKey(recordName:String, key:String, value:Double) {

        fetchRemoteRecord(recordName) { (fetchedRecord) -> Void in
            if let fetchedRecord = fetchedRecord {
                fetchedRecord[key] = value
                self.saveRemoteRecord(fetchedRecord)
            } else {
                let recordID = CKRecordID(recordName: recordName)
                let record = CKRecord(recordType: "Activity", recordID: recordID)
                record[key] = value
                print("Updating record for key \(key) value\(value)")
                self.saveRemoteRecord(record)
            }
        }
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
                if let discoveredUserInfo = discoveredUserInfo {
                    let recordId = discoveredUserInfo.userRecordID
                    if let _ = recordId {


                    }
                }

                //print("Printing discovered user info \(discoveredUserInfo)")
            }
        }
    }
}