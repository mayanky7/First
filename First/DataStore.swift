//
//  DataStore.swift
//  First
//
//  Created by Mayank Yadav on 29/08/15.
//  Copyright © 2015 First. All rights reserved.
//

import CloudKit

class DataStore {

    let container = CKContainer.defaultContainer()
    let database = CKContainer.defaultContainer().publicCloudDatabase

    func saveRemoteRecord(record:CKRecord) {

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

    func fetchRemoteRecords(userIdentifiers:[String], recordType:String, completion:([CKRecord]?) -> Void) {

        let mainThreadCompletion = { (records: [CKRecord]?, error: NSError?) -> Void in
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(records)
            })
        }

        guard let firstIdentifier = userIdentifiers.first else {
            print("Did not find any user identifiers")
            mainThreadCompletion(nil, nil)
            return
        }

        let predicate = NSPredicate(format: "userIdentifier == %@", firstIdentifier)
        let query = CKQuery(recordType: recordType, predicate: predicate)

        database.performQuery(query, inZoneWithID: nil) { (records, error) -> Void in
            if let error = error {
                print("Error fetch user record ID \(error)")
                mainThreadCompletion(nil, error)
            } else {
                print("Fetched user records \(records)")
                mainThreadCompletion(records, nil)
            }
        }
    }

    func updateRemoteRecordForRecordName(recordName:String, recordType:String, valueMap:[String:AnyObject]) {

        fetchRemoteRecord(recordName) { (fetchedRecord) -> Void in

            var recordToSave: CKRecord? = nil;
            if let fetchedRecord = fetchedRecord {
                assert(fetchedRecord.recordType == recordType) //FIXME:
                recordToSave = fetchedRecord;
                print("Fetched record \(fetchedRecord)")
            } else {
                let recordID = CKRecordID(recordName: recordName)
                let record = CKRecord(recordType: recordType, recordID: recordID)
                print("Created record \(fetchedRecord)")
                recordToSave = record;
            }

            if let recordToSave = recordToSave {
                for key in valueMap.keys {
                    recordToSave[key] = valueMap[key] as? CKRecordValue
                }
                print("Updating record with recordName \(recordName) values\(valueMap)")
                self.saveRemoteRecord(recordToSave)
            } else {
                print("Failed to create record with recordName \(recordName) values\(valueMap)")
            }
        }
    }

    //Social
    func requestDiscoveryPermission(completion:(Bool) -> Void) {

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

    func fetchUserRecordIdentifier(completion:(String?, NSError?) -> Void) {

        let mainThreadCompletion = { (recordID: CKRecordID?, error: NSError? ) -> Void in
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(recordID?.recordName, error);
            })
        }

        container.fetchUserRecordIDWithCompletionHandler { (recordID, error) -> Void in
            if let error = error {
                mainThreadCompletion(nil, error)
                print("Error fetch user record ID \(error)")
            } else {
                print("Fetched user record ID \(recordID)")
                mainThreadCompletion(recordID, nil);
            }
        }
    }

    func fetchAddressbookFriends(completion:([CKDiscoveredUserInfo]?) -> Void) {

        let mainThreadCompletion = { (contacts: [CKDiscoveredUserInfo]?) -> Void in
            dispatch_async(dispatch_get_main_queue(), { () -> Void in
                completion(contacts);
            })
        }

        container.discoverAllContactUserInfosWithCompletionHandler { (discoveredUserInfos, error) -> Void in
            if let error = error {
                print("Error fetching addressbook friends \(error)")
                mainThreadCompletion(nil)
            } else {
                mainThreadCompletion(discoveredUserInfos)
            }
        }
    }
}