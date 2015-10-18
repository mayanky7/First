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

    let activityNamePrefix = "activity:"
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
                let map:[String: AnyObject] = ["steps":stepCount,
                    "userIdentifier":recordIdentifier];

                let recrordName = self.activityNamePrefix+recordIdentifier
                self.dataStore.updateRemoteRecordForRecordName(recrordName, recordType:"Activity", valueMap: map)
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
                    nameIDMap[self.activityNamePrefix+recordName] = name
                    return recordName
                })

                //Fetch activities for those record IDs and create person objects
                self.dataStore.fetchRemoteRecords(recordNames, recordType:"Activity", completion: { (records) -> Void in

                    let persons = records?.map({ (let record) -> Person in
                        let identifier = record.recordID.recordName
                        var stepCount:Double? = (record["steps"] as? Double?)!
                        if stepCount == nil {
                            stepCount = 0;
                        }

                        let name = nameIDMap[identifier]!
                        let person = Person(userName: name, userSteps: stepCount!, userIdentifier: identifier)
                        return person
                    })

                    var mutablePersons = self.dummyPersonsWithSteps()
                    if let persons = persons {
                        mutablePersons = mutablePersons + persons
                    }

                    let sortedBySteps = mutablePersons.sort({ (first:Person, second:Person) -> Bool in
                        return first.steps > second.steps
                    })

                    completion(sortedBySteps)
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

    private func dummyPersonsWithSteps() -> [Person] {

        var mutablePersons = [Person]()
        let userNames = ["Harshey", "Little Mermaid", "Bamby", "Pinocchio", "Snowhite", "Cinderella", "Dumbo", "Sleeping Beauty", "Alice"]
        for index in 0..<9 {
            let randomSteps = Int(arc4random_uniform(10000))
            let person = Person(userName: userNames[index], userSteps: Double(randomSteps), userIdentifier: NSUUID().UUIDString)
            mutablePersons.append(person)
        }

        return mutablePersons
    }
}