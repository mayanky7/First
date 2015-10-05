//
//  ActivityStore.swift
//  First
//
//  Created by Mayank Yadav on 05/09/15.
//  Copyright © 2015 First. All rights reserved.
//

import Foundation
import HealthKit
import Contacts
import CloudKit

class ActivityStore {

    let healthStore:HKHealthStore
    let dataStore:DataStore = DataStore()

    init(healthKitStore: HKHealthStore) {
        healthStore = healthKitStore;
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

        dataStore.fetchUserRecordIdentifier { (recordIdentifier, error) -> Void in
            if let recordIdentifier = recordIdentifier {
                self.dataStore.updateRemoteRecordForRecordName(recordIdentifier, key: "steps", value: stepCount)
            }
        }
    }

    func fetchFriendsStepCount(completion:([Person]?) -> Void) {

        fetchFriends { (friends) -> Void in

            if let friends = friends {
                //Fetch all friends record IDs
                var nameIDMap = [String:String]();
                let recordNames = friends.map({ (let userInfo:CKDiscoveredUserInfo) -> String in
                    let recordName = (userInfo.userRecordID?.recordName)!
                    let name = (userInfo.displayContact?.familyName)!
                    nameIDMap[recordName] = name
                    return recordName
                })

                //Fetch activities for those record IDs and create person objects
                self.dataStore.fetchRemoteRecords(recordNames, completion: { (records) -> Void in

                    let persons = records?.map({ (let record) -> Person in
                        let identifier = record.recordID.recordName
                        var stepCount:Double? = record["steps"] as! Double?
                        if stepCount == nil {
                            stepCount = 0;
                        }
                        let name = nameIDMap[identifier]!
                        let person = Person(userName: name, userSteps: stepCount!, userIdentifier: identifier)
                        return person
                    })

                    completion(persons)
                })
            } else {
                completion(nil)
            }
        }
    }

    private func fetchFriends(completion:([CKDiscoveredUserInfo]?) -> Void) {
        dataStore.fetchAddressbookFriends { (userInfos) -> Void in
            if let userInfos = userInfos {
                completion(userInfos)
            } else {
                print("Failed to fetch user infos")
                completion(nil)
            }
        }
    }
}