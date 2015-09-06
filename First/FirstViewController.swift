import UIKit
import HealthKit

class FirstViewController: UIViewController, UITableViewDataSource {

    var stepCount = 0.0

    @IBOutlet weak var tableView: UITableView!;

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: NSBundle?) {
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil);
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        requestAccess()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    func setupUI() {
        self.tableView.registerClass(UITableViewCell.classForCoder(), forCellReuseIdentifier: "cell");
        self.tableView.dataSource = self;
    }

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return 1;
    }

    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {

        let cell:UITableViewCell = tableView.dequeueReusableCellWithIdentifier("cell")!
        cell.textLabel?.text = "Today's step count is \(self.stepCount)"

        return cell;
    }

    func requestAccess() {

        let store = ActivityStore(healthKitStore: HKHealthStore())

        store.requestDiscoveryPermission { (success) -> Void in
            if success {
                store.fetchFriends()
                self.requestSteps(store)
            }
        }
    }

    func requestSteps(store:ActivityStore) {

        store.fetchStepCount { (steps, error) -> Void in

            if let steps = steps {

                self.stepCount = steps
                self.tableView.reloadData()
            }
        }
    }
}