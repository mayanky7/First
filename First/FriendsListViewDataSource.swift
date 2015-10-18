//
//  FriendsListViewDataSource.swift
//  First
//
//  Created by Mayank Yadav on 04/10/15.
//  Copyright © 2015 First. All rights reserved.
//

import UIKit
import HealthKit
import Contacts

class FriendsListViewDataSource: NSObject, UITableViewDataSource {

    var tableView: UITableView
    var friends = [Person]()
    var person: Person? = nil;

    init(tableView: UITableView) {

        self.tableView = tableView;
        super.init();
        startFetchingData();
    }

    //MARK: - UITableViewDataSource
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return friends.count
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {

        let cellIdentifier = "cell"
        var cell = tableView.dequeueReusableCellWithIdentifier(cellIdentifier)
        if (cell == nil) {
            cell = UITableViewCell(style: UITableViewCellStyle.Value1, reuseIdentifier: cellIdentifier)
        }

        let constCell = cell!
        let contact = self.friends[indexPath.row]
        constCell.textLabel?.text = contact.name
        print("Cell Steps \(contact.steps)")
        constCell.detailTextLabel?.text = "\(contact.steps)"

        return constCell;
    }

    //MARK: - Data Fetching
    private func startFetchingData() {

        Authenticator().requestPermissions { (success) -> Void in
            if success {
                let store = ActivityStore(healthKitStore: HKHealthStore())
                self.fetchPersonData(store)
                self.fetchFriendData(store)
            } else {
                print("Failed to get permissions")
            }
        }
    }

    //MARK: Data Updates
    private func fetchPersonData(store:ActivityStore) {

        store.fetchStepCount({ (steps, error) -> Void in
            if let steps = steps {
                self.updatePerson(steps)
                self.tableView.reloadData()
            }
        })
    }

    private func fetchFriendData(store: ActivityStore) {

        store.fetchFriendsStepCount { (fetchedContacts) -> Void in
            if let fetchedContacts = fetchedContacts {
                self.updateFriends(fetchedContacts)
            }
        }
    }

    private func updateFriends(friends: [Person]) {
        self.friends.appendContentsOf(friends)
        self.tableView.reloadData()
    }

    private func updatePerson(stepCount: Double) {

        assert(person == nil)
        let personIdentifier = NSUUID()
        person = Person(userName: "You", userSteps: stepCount, userIdentifier: personIdentifier.UUIDString)
        friends.append(person!)
        self.tableView.reloadData()
    }
}