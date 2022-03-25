use itertools::interleave;
use temp_rust_lib_two::add_one;

pub fn temp() {
    for elt in interleave(&[1, 2, 3], &[2, 3, 4]) {
        println!("{}", elt);
    }
}

pub fn temp_two() {
    println!("{}", add_one(1));
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
