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

        let mainThreadCompletion = { (record: CKRecord?) -> Void in
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(record);
            })
        }

        database.fetchRecordWithID(recordID) { (record, error) -> Void in
            if let record = record {
                mainThreadCompletion(record)
            } else {
                mainThreadCompletion(nil)
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

        let mainThreadCompletion = { (complete: Bool) -> Void in
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(complete);
            })
        }

        container.requestApplicationPermission(CKApplicationPermissions.UserDiscoverability) { (status, error) -> Void in

            if status == CKApplicationPermissionStatus.Granted {
                mainThreadCompletion(true)
            } else {
                mainThreadCompletion(false)
            }
        }
    }

    func fetchAddressbookFriends(completion:([CNContact]?) -> Void) {

        let defaultContainer = CKContainer.defaultContainer()
        let email = "mayanky7@gmail.com"

        let mainThreadCompletion = { (contacts: [CNContact]?) -> Void in
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(contacts);
            })
        }

        defaultContainer.discoverUserInfoWithEmailAddress(email) { (discoveredUserInfo, error) -> Void in
            if let error = error {
                print("Error fetching addressbook friends \(error)")
                mainThreadCompletion(nil)
            } else {

                if let discoveredUserInfo = discoveredUserInfo {

                    let contact = discoveredUserInfo.displayContact
                    var contacts = [CNContact]()
                    if let contact = contact {
                        contacts.append(contact)
                    }

                    mainThreadCompletion(contacts)
                    print("Found contacts \(discoveredUserInfo)")
                }
            }
        }
    }
}