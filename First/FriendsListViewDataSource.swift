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
    var contacts = [Person]()
    var person: Person? = nil;

    init(tableView: UITableView) {

        self.tableView = tableView;
        super.init();
        startFetchingData();
    }

    //MARK: - UITableViewDataSource
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return contacts.count
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {

        let cellIdentifier = "cell"
        var cell = tableView.dequeueReusableCellWithIdentifier(cellIdentifier)
        if (cell == nil) {
            cell = UITableViewCell(style: UITableViewCellStyle.Value1, reuseIdentifier: cellIdentifier)
        }

        let constCell = cell!
        let contact = self.contacts[indexPath.row]
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
                self.updatePersonData(steps)
                self.tableView.reloadData()
            }
        })
    }

    private func fetchFriendData(store: ActivityStore) {

        store.fetchFriendsStepCount { (fetchedContacts) -> Void in
            if let fetchedContacts = fetchedContacts {
                self.updateContactData(fetchedContacts)
            }
        }
    }

    private func updateContactData(friends: [Person]) {
        self.contacts.appendContentsOf(friends)
        self.tableView.reloadData()
    }

    private func updatePersonData(stepCount: Double) {

        assert(person == nil)
        let personIdentifier = NSUUID()
        person = Person(userName: "Self", userSteps: stepCount, userIdentifier: personIdentifier.UUIDString)
        contacts.append(person!)
        self.tableView.reloadData()
    }
}