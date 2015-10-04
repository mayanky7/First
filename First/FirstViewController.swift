import UIKit
import HealthKit

class FirstViewController: UIViewController {

    var stepCount = 0.0
    var dataSource: FriendsListViewDataSource? = nil;

    @IBOutlet weak var tableView: UITableView!;

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: NSBundle?) {
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil);
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }

    override func viewDidLoad() {

        super.viewDidLoad()
        setupDataSource()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    func setupDataSource() {
        dataSource = FriendsListViewDataSource(tableView: tableView)
        tableView.dataSource = dataSource
    }
}